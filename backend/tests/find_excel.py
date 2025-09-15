import os

def find_excel_file():
    current_dir = os.getcwd()
    print(f"Directorio actual: {current_dir}")
    
    # Listar todos los archivos en el directorio actual y subdirectorios
    for root, dirs, files in os.walk(current_dir):
        for file in files:
            if file.endswith('.xlsx'):
                print(f"Archivo Excel encontrado: {os.path.join(root, file)}")

if __name__ == '__main__':
    find_excel_file()