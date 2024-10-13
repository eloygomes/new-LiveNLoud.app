

import socketio

sio = socketio.Client()

NODEJS_URL = 'http://node:3000'  # URL do servidor Node.js
NAMESPACE = '/python'            # Namespace a ser utilizado

# Evento de conexão com o namespace especificado


@sio.event(namespace=NAMESPACE)
def connect():
    print("Conectado ao servidor Node.js via Socket.IO")
    # Não é necessário enviar mensagem imediatamente

# Evento de desconexão


@sio.event(namespace=NAMESPACE)
def disconnect():
    print("Desconectado do servidor Node.js")

# Receber dados para processamento do servidor


@sio.on('processData', namespace=NAMESPACE)
def receber_dados(data):
    print(f"Dados recebidos para processamento: {data}")
    try:
        audio_data = data['audioData']
        client_id = data['clientId']
        print(f"Dados de áudio recebidos: {audio_data}")
        # Aqui você pode processar 'audio_data' conforme necessário

        processado_p_python = {'processado_python': [0.1, 0.2, 0.3, 0.4, 0.5]}

        # Após o processamento, envie os dados de volta ao servidor
        resultado = {'processedData': processado_p_python,
                     'clientId': client_id}
        sio.emit('processedData', resultado, namespace=NAMESPACE)
        print("Dados processados enviados ao servidor")
    except KeyError as e:
        print(f"Chave não encontrada nos dados recebidos: {e}")


if __name__ == '__main__':
    print(f"Tentando conectar ao servidor Node.js no namespace {
          NAMESPACE} em {NODEJS_URL}")
    sio.connect(NODEJS_URL, namespaces=[NAMESPACE])
    sio.wait()  # Manter o script rodando
