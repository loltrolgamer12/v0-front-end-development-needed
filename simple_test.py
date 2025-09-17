from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working!', 'status': 'success'})

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    return jsonify({
        'success': True,
        'message': 'Dashboard test working',
        'data': {
            'total_conductores': 0,
            'total_vehiculos': 0,
            'fallas_criticas': 0
        }
    })

if __name__ == '__main__':
    print("Starting simple Flask test server...")
    app.run(debug=True, host='0.0.0.0', port=5000)