#!/usr/bin/env python3
"""
Script para configurar el entorno de desarrollo local
"""
import subprocess
import sys
import os

def run_command(command, cwd=None):
    """Ejecuta un comando y maneja errores"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, check=True)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error ejecutando: {command}")
        print(f"Error: {e}")
        return False

def setup_python_services():
    """Instala dependencias para todos los servicios Python"""
    print("Instalando dependencias Python...")
    run_command("pip install -r requirements.txt")

def setup_frontend():
    """Instala dependencias del frontend"""
    print("Configurando frontend...")
    run_command("npm install", cwd="frontend")

def main():
    print("🚀 Configurando entorno de desarrollo local...")
    
    if not run_command("python --version"):
        print("❌ Python no encontrado. Instala Python 3.8+")
        sys.exit(1)
    
    if not run_command("node --version"):
        print("❌ Node.js no encontrado. Instala Node.js 16+")
        sys.exit(1)
    
    setup_python_services()
    setup_frontend()
    
    print("\n✅ Configuración completada!")
    print("\n📋 Próximos pasos:")
    print("1. Asegúrate de que PostgreSQL esté corriendo")
    print("2. Ejecuta: python start_dev.py")
    print("\n📁 Estructura del proyecto:")
    print("- /services/ - Microservicios Python")
    print("- /frontend/ - Aplicación React")
    print("- /shared/ - Código compartido (modelos, DB)")
    print("- requirements.txt - Dependencias Python unificadas")

if __name__ == "__main__":
    main()