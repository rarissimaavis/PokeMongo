from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.json_util import dumps
import json

# --- App Configuration ---
app = Flask(__name__)
CORS(app)

# --- Database Setup ---
client = MongoClient('mongodb://localhost:27017/pokemon_db?directConnection=true')
db = client['pokemon_db']
trainers_col = db['Trainers']
pokemon_col = db['Pokemon']

# --- Helper Functions ---
def clean_id(data):
    """Recursively clean MongoDB ObjectId from data structures"""
    if isinstance(data, list):
        return [clean_id(item) for item in data]
    if isinstance(data, dict):
        data.pop('_id', None)
        return {k: clean_id(v) for k, v in data.items()}
    return str(data) if isinstance(data, ObjectId) else data

def validate_trainer_exists(trainer_id):
    """Check if trainer exists before operations"""
    return trainers_col.find_one({"trainerID": trainer_id})

# --- Trainer Endpoints ---
@app.route('/trainers', methods=['GET'])
def get_trainers():
    """Get all trainers"""
    return jsonify(clean_id(list(trainers_col.find())))

@app.route('/trainers', methods=['POST'])
def add_trainer():
    """Add new trainer"""
    result = trainers_col.insert_one(request.json)
    return jsonify({"_id": str(result.inserted_id)}), 201

@app.route('/trainers/<string:trainer_id>', methods=['PUT'])
def update_trainer(trainer_id):
    """Update trainer by ID"""
    result = trainers_col.update_one(
        {"_id": ObjectId(trainer_id)},
        {"$set": request.json}
    )
    return jsonify({"modified_count": result.modified_count})

@app.route('/trainers/<string:trainer_id>', methods=['DELETE'])
def delete_trainer(trainer_id):
    """Delete trainer and their pokemon"""
    result_trainer = trainers_col.delete_one({"_id": ObjectId(trainer_id)})
    result_pokemon = pokemon_col.delete_many({"trainerID": trainer_id})
    return jsonify({
        "trainer_deleted": result_trainer.deleted_count,
        "pokemon_deleted": result_pokemon.deleted_count
    })

# --- Pokemon Endpoints ---
@app.route('/pokemon', methods=['GET'])
def get_pokemon():
    """Get all pokemon"""
    return jsonify(clean_id(list(pokemon_col.find())))

@app.route('/pokemon', methods=['POST'])
def add_pokemon():
    """Add new pokemon with trainer validation"""
    data = request.json
    if not validate_trainer_exists(data['trainerID']):
        return jsonify({"error": "Trainer not found"}), 404
    result = pokemon_col.insert_one(data)
    return jsonify({"_id": str(result.inserted_id)}), 201

@app.route('/pokemon/<string:pokemon_id>', methods=['PUT'])
def update_pokemon(pokemon_id):
    """Update pokemon by ID"""
    result = pokemon_col.update_one(
        {"_id": ObjectId(pokemon_id)},
        {"$set": request.json}
    )
    return jsonify({"modified_count": result.modified_count})

@app.route('/pokemon/<string:pokemon_id>', methods=['DELETE'])
def delete_pokemon(pokemon_id):
    """Delete pokemon by ID"""
    result = pokemon_col.delete_one({"_id": ObjectId(pokemon_id)})
    return jsonify({"deleted_count": result.deleted_count})

# --- JOIN Operations ---
@app.route('/trainers/<int:trainer_id>/pokemon', methods=['GET'])
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
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/trainers/with-pokemon-above/<int:min_level>', methods=['GET'])
def get_trainers_with_strong_pokemon(min_level):
    """Get trainers with Pokémon above specified level (optimized structure)"""
    try:
        pipeline = [
            # Filter Pokémon collection for efficiency
            {
                "$match": {
                    "pokelevel": {"$gt": min_level}
                }
            },
            # Group by trainer and collect Pokemon details
            {
                "$group": {
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
                }
            },
            # Join with trainers collection
            {
                "$lookup": {
                    "from": "Trainers",
                    "localField": "_id",
                    "foreignField": "trainerID",
                    "as": "trainer_info"
                }
            },
            # Unwind and structure the output
            {
                "$unwind": "$trainer_info"
            },
            {
                "$project": {
                    "_id": 0,
                    "trainer": {
                        "trainerID": "$_id",
                        "name": "$trainer_info.trainername",
                        "total_strong_pokemon": "$pokemon_count"
                    },
                    "pokemon": "$pokemon_list"
                }
            },
            # Sort by trainerID
            {
                "$sort": {"trainer.trainerID": 1}
            }
        ]

        result = list(pokemon_col.aggregate(pipeline))
        
        if not result:
            return jsonify({"message": f"No trainers found with Pokémon above level {min_level}"})
            
        return jsonify({"results": result})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Frontend Serving ---
@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(debug=True)