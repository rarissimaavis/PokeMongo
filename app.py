from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient, WriteConcern
from pymongo.read_concern import ReadConcern
from pymongo.errors import ConnectionFailure, OperationFailure, WriteError, ServerSelectionTimeoutError
from bson.objectid import ObjectId
from bson.json_util import dumps
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import json
import time

# --- App Configuration ---
app = Flask(__name__)
CORS(app)

# --- Database Setup ---
def get_mongo_client():
    """Create MongoDB client with proper configuration for partition tolerance"""
    try:
        # Replica set connection string
        connection_string = 'mongodb://localhost:27017,localhost:27018,localhost:27019/pokemon_db?replicaSet=rs0&w=majority&wtimeoutMS=5000'
        
        client = MongoClient(
            connection_string,
            maxPoolSize=50,
            minPoolSize=10,
            maxIdleTimeMS=30000,
            waitQueueTimeoutMS=2500,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=2000,
            socketTimeoutMS=2000,
            retryWrites=True,
            retryReads=True,
            w='majority',
            readPreference='primary'
        )
        
        client.admin.command('ping')
        return client
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        raise

# Initialize client with retry logic
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((ConnectionFailure, ServerSelectionTimeoutError))
)
def initialize_db():
    """Initialize database connection with retry logic"""
    client = get_mongo_client()
    db = client['pokemon_db']
    
    if 'Trainers' not in db.list_collection_names():
        db.create_collection('Trainers')
    if 'Pokemon' not in db.list_collection_names():
        db.create_collection('Pokemon')
    
    # Configure collections with proper write and read concerns
    trainers_col = db['Trainers'].with_options(
        write_concern=WriteConcern(w='majority', wtimeout=5000),
        read_concern=ReadConcern(level='majority')
    )
    pokemon_col = db['Pokemon'].with_options(
        write_concern=WriteConcern(w='majority', wtimeout=5000),
        read_concern=ReadConcern(level='majority')
    )
    
    trainers_col.create_index('trainerID', unique=True)
    pokemon_col.create_index('trainerID')
    
    return client, db, trainers_col, pokemon_col

try:
    client, db, trainers_col, pokemon_col = initialize_db()
except Exception as e:
    print(f"Failed to initialize database after retries: {str(e)}")
    raise

# --- Helper Functions ---
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((ConnectionFailure, OperationFailure, ServerSelectionTimeoutError))
)
def execute_with_retry(operation):
    """Execute database operations with retry logic"""
    try:
        return operation()
    except (ConnectionFailure, OperationFailure, ServerSelectionTimeoutError) as e:
        print(f"Operation failed: {str(e)}")
        raise

def clean_id(data):
    """Recursively clean MongoDB ObjectId from data structures"""
    try:
        if isinstance(data, list):
            return [clean_id(item) for item in data]
        if isinstance(data, dict):
            if '_id' in data:
                data['_id'] = str(data['_id'])
            return {k: clean_id(v) for k, v in data.items()}
        return str(data) if isinstance(data, ObjectId) else data
    except Exception as e:
        print(f"Error cleaning ID: {str(e)}")
        return data

def validate_trainer_exists(trainer_id, session=None):
    """Check if trainer exists before operations"""
    try:
        trainer = trainers_col.find_one({"trainerID": int(trainer_id)}, session=session)
        return trainer
    except Exception as e:
        print(f"Error validating trainer: {str(e)}")
        return None

# --- Trainer Endpoints ---
@app.route('/api/trainers', methods=['GET'])
def get_trainers():
    """Get all trainers"""
    try:
        trainers = execute_with_retry(lambda: list(trainers_col.find()))
        return jsonify(clean_id(trainers)), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch trainers: {str(e)}"}), 500

@app.route('/api/trainers', methods=['POST'])
def add_trainer():
    """Add new trainer"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        with client.start_session() as session:
            with session.start_transaction():
                result = trainers_col.insert_one(data, session=session)
                return jsonify({"_id": str(result.inserted_id)}), 201
    except WriteError as e:
        return jsonify({"error": f"Write operation failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to add trainer: {str(e)}"}), 500

@app.route('/api/trainers/<string:trainer_id>', methods=['PUT'])
def update_trainer(trainer_id):
    """Update trainer by ID"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No update data provided"}), 400

        result = trainers_col.update_one(
            {"_id": ObjectId(trainer_id)},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Trainer not found"}), 404
            
        return jsonify({
            "modified_count": result.modified_count,
            "message": "Trainer updated successfully"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update trainer: {str(e)}"}), 500

@app.route('/api/trainers/<string:trainer_id>', methods=['DELETE'])
def delete_trainer(trainer_id):
    """Delete trainer and their pokemon"""
    try:        
        result_trainer = trainers_col.delete_one({"_id": ObjectId(trainer_id)})
        result_pokemon = pokemon_col.delete_many({"trainerID": trainer_id})
        
        if result_trainer.deleted_count == 0:
            return jsonify({"error": "Trainer not found"}), 404
            
        return jsonify({
            "trainer_deleted": result_trainer.deleted_count,
            "pokemon_deleted": result_pokemon.deleted_count,
            "message": "Trainer and associated pokemon deleted"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete trainer: {str(e)}"}), 500

# --- Pokemon Endpoints ---
@app.route('/api/pokemon', methods=['GET'])
def get_pokemon():
    """Get all pokemon"""
    try:
        pokemons = list(pokemon_col.find())
        return jsonify(clean_id(pokemons)), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch pokemon: {str(e)}"}), 500

@app.route('/api/pokemon', methods=['POST'])
def add_pokemon():
    """Add new pokemon with trainer validation"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        if 'trainerID' not in data:
            return jsonify({"error": "trainerID is required"}), 400
            
        with client.start_session() as session:
            with session.start_transaction():
                if not validate_trainer_exists(data['trainerID'], session):
                    return jsonify({"error": "Trainer not found"}), 404
                
                result = pokemon_col.insert_one(data, session=session)
                return jsonify({
                    "_id": str(result.inserted_id),
                    "message": "Pokemon added successfully"
                }), 201
    except WriteError as e:
        return jsonify({"error": f"Write operation failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to add pokemon: {str(e)}"}), 500

@app.route('/api/pokemon/<string:pokemon_id>', methods=['PUT'])
def update_pokemon(pokemon_id):
    """Update pokemon by ID"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No update data provided"}), 400

        with client.start_session() as session:
            with session.start_transaction():
                result = pokemon_col.update_one(
                    {"_id": ObjectId(pokemon_id)},
                    {"$set": data},
                    session=session
                )
                
                if result.matched_count == 0:
                    return jsonify({"error": "Pokemon not found"}), 404
                    
                return jsonify({
                    "modified_count": result.modified_count,
                    "message": "Pokemon updated successfully"
                }), 200
    except WriteError as e:
        return jsonify({"error": f"Write operation failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to update pokemon: {str(e)}"}), 500

@app.route('/api/pokemon/<string:pokemon_id>', methods=['DELETE'])
def delete_pokemon(pokemon_id):
    """Delete pokemon by ID"""
    try:
        with client.start_session() as session:
            with session.start_transaction():
                result = pokemon_col.delete_one(
                    {"_id": ObjectId(pokemon_id)},
                    session=session
                )
                
                if result.deleted_count == 0:
                    return jsonify({"error": "Pokemon not found"}), 404
                    
                return jsonify({
                    "deleted_count": result.deleted_count,
                    "message": "Pokemon deleted successfully"
                }), 200
    except WriteError as e:
        return jsonify({"error": f"Write operation failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to delete pokemon: {str(e)}"}), 500

# --- JOIN Operations ---
@app.route('/api/trainers/<int:trainer_id>/pokemon', methods=['GET'])
def get_trainer_pokemon(trainer_id):
    """Get trainer with all their pokemon"""
    try:
        pipeline = [
            {"$match": {"trainerID": trainer_id}},
            {"$lookup": {
                "from": "Pokemon",
                "localField": "trainerID",
                "foreignField": "trainerID",
                "as": "pokemon"
            }},
            {"$project": {
                "_id": 0,
                "trainerID": 1,
                "trainername": 1,
                "pokemon": 1
            }}
        ]
        
        result = list(trainers_col.aggregate(pipeline))
        if not result:
            return jsonify({"error": "Trainer not found"}), 404

        return jsonify({
            "trainer": {
                "trainerID": result[0]["trainerID"],
                "trainername": result[0]["trainername"]
            },
            "pokemon": clean_id(result[0]["pokemon"])
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch trainer pokemon: {str(e)}"}), 500

@app.route('/api/trainers/with-pokemon-above/<int:min_level>', methods=['GET'])
def get_trainers_with_strong_pokemon(min_level):
    """Get trainers with Pokémon above specified level"""
    try:
        pipeline = [
            {"$match": {"pokelevel": {"$gt": min_level}}},
            {"$group": {
                "_id": "$trainerID",
                "pokemon_count": {"$sum": 1},
                "pokemon_list": {
                    "$push": {
                        "name": "$pokename",
                        "level": "$pokelevel",
                        "type1": "$type1",
                        "type2": "$type2"
                    }
                }
            }},
            {"$lookup": {
                "from": "Trainers",
                "localField": "_id",
                "foreignField": "trainerID",
                "as": "trainer_info"
            }},
            {"$unwind": "$trainer_info"},
            {"$project": {
                "_id": 0,
                "trainer": {
                    "trainerID": "$_id",
                    "name": "$trainer_info.trainername",
                    "total_strong_pokemon": "$pokemon_count"
                },
                "pokemon": "$pokemon_list"
            }},
            {"$sort": {"trainer.trainerID": 1}}
        ]

        result = list(pokemon_col.aggregate(pipeline))
        
        if not result:
            return jsonify({"message": f"No trainers found with Pokémon above level {min_level}"}), 200
            
        return jsonify({"results": result}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch strong pokemon trainers: {str(e)}"}), 500

# --- Database Health Check Endpoint ---
@app.route('/api/health', methods=['GET'])
def check_db_health():
    """Check database connection health"""
    try:
        client.admin.command('ping')
        return jsonify({"status": "healthy", "message": "Database connection is active"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 503

# --- Frontend Serving ---
@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/pokemon')
def pokemon_page():
    return render_template('pokemon.html')

@app.route('/trainers')
def trainers_page():
    return render_template('trainers.html')

@app.route('/join')
def join_page():
    return render_template('join.html')

if __name__ == '__main__':
    app.run(debug=True)