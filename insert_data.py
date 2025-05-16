from pymongo import MongoClient
import json

client = MongoClient('mongodb://localhost:27017,localhost:27018,localhost:27019/pokemon_db?replicaSet=rs0')
db = client['pokemon_db']

# Clear existing data
db.Trainers.delete_many({})
db.Pokemon.delete_many({})

# Insert trainers
with open('trainers.json') as f:
    trainers = json.load(f)
    db.Trainers.insert_many(trainers)

# Insert pokemon
with open('pokemon.json') as f:
    pokemon = json.load(f)
    db.Pokemon.insert_many(pokemon)

print("Data inserted")
