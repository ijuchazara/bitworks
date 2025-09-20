import subprocess
import threading
import time
import os
import signal
import sys
from dotenv import load_dotenv

load_dotenv()

CORE_PORT = os.getenv("CORE_PORT", "8000")
AGENT_PORT = os.getenv("AGENT_PORT", "8001")
FRONTEND_PORT = os.getenv("FRONTEND_PORT", "3000")

processes = []


def run_service(name, command, cwd=None, port=None):
    def target():
        try:
            print(f"🚀 Iniciando {name}" + (f" en puerto {port}" if port else ""))
            process = subprocess.Popen(command, shell=True, cwd=cwd)
            processes.append(process)
            process.wait()
        except Exception as e:
            print(f"❌ Error en {name}: {e}")

    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    return thread


def signal_handler(sig, frame):
    print("\n🛑 Cerrando servicios...")
    for process in processes:
        try:
            process.terminate()
        except:
            pass
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, signal_handler)

    print("🏗️ Iniciando sistema de agente...")
    print("Presiona Ctrl+C para detener todos los servicios\n")

    services = [
        ("Core Service", "python main.py", "services/core", CORE_PORT),
        ("Agent Service", "python main.py", "services/agent", AGENT_PORT),
    ]

    threads = []

    for name, command, cwd, port in services:
        thread = run_service(name, command, cwd, port)
        threads.append(thread)
        time.sleep(2)

    frontend_thread = run_service("Frontend", "yarn dev", "frontend", FRONTEND_PORT)
    threads.append(frontend_thread)

    print("\n✅ Todos los servicios iniciados!")
    print(f"✨ Frontend: http://localhost:{FRONTEND_PORT}")
    print(f"📦 Core Service (API Interna): http://localhost:{CORE_PORT}")
    print(f"📢 Agent Service (API Pública): http://localhost:{AGENT_PORT}")
    print("\nPresiona Ctrl+C para detener...\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)


if __name__ == "__main__":
    main()