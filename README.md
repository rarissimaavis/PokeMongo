# PokéMongo 

## Prerequisites

- Python 3.x
- MongoDB
- pip

## Installation

1. Clone this repository:
```bash
git clone https://github.com/rarissimaavis/PokeMongo.git
cd PokeMongo
```

2. Create and activate a virtual environment:

For WSL/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

For Windows Command Prompt:
```bash
python -m venv venv
venv\Scripts\activate
```

3. Install required dependencies:
```bash
pip install -r requirements.txt
```

4. Download dataset:
   - Visit [Pokemon Trainers Dataset](https://www.kaggle.com/datasets/lrcusack/pokemontrainers?resource=download)
   - Download the dataset and extract the following files to the project root:
     - `Trainers.csv`
     - `Pokemon.csv`

5. Convert CSV files to JSON format:
```bash
python convert.py
```

## Running the Application

1. Make sure MongoDB is running on your system

2. Start MongoDB replica set instances
```bash
mongod --config mongodb-config/mongod-1.conf
mongod --config mongodb-config/mongod-2.conf
mongod --config mongodb-config/mongod-3.conf
```

3. Start the Flask application:
```bash
python app.py
```

3. Open your web browser and navigate to:
```
http://localhost:5000
```
