import requests
import time

def test_api():
    """Test simple para verificar que la API funcione"""
    base_url = "http://127.0.0.1:5000"
    
    # Esperar un poco para que Flask se inicie
    time.sleep(2)
    
    try:
        # Test 1: Dashboard
        print("Probando /api/dashboard...")
        response = requests.get(f"{base_url}/api/dashboard", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test 2: Drivers endpoint
        print("\nProbando /api/drivers...")
        response = requests.get(f"{base_url}/api/drivers", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        print("\n✅ API está funcionando correctamente!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se puede conectar a la API. ¿Está Flask ejecutándose?")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_api()