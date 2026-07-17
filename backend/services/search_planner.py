import re
import unicodedata
from itertools import product


MAX_CREDITS_PER_PLAN = 24

SEARCH_PACKS = {
    "direito de transito": {
        "label": "Direito de Trânsito",
        "economico": (
            "advogado de trânsito",
            "recurso de multa",
            "defesa cnh",
        ),
        "completo": (
            "advogado de trânsito",
            "recurso de multa",
            "recorrer multa de trânsito",
            "defesa cnh",
            "advogado especialista em trânsito",
            "recurso cnh",
            "multa de trânsito advogado",
            "defesa direito de dirigir",
        ),
    },
    "lei seca": {
        "label": "Lei Seca",
        "economico": (
            "recusa bafômetro",
            "recurso multa bafômetro",
            "advogado lei seca",
        ),
        "completo": (
            "recusa bafômetro",
            "recurso multa bafômetro",
            "recorrer multa de bafômetro",
            "defesa lei seca",
            "advogado bafômetro",
            "advogado lei seca",
            "multa por embriaguez ao volante",
            "suspensão cnh lei seca",
        ),
    },
    "suspensao": {
        "label": "Suspensão",
        "economico": (
            "recurso suspensão cnh",
            "advogado suspensão cnh",
            "cnh suspensa",
        ),
        "completo": (
            "recurso suspensão cnh",
            "advogado suspensão cnh",
            "cnh suspensa",
            "defesa suspensão carteira",
            "processo suspensão cnh",
            "recorrer suspensão direito de dirigir",
            "multa com suspensão cnh",
            "como recuperar cnh suspensa",
        ),
    },
    "cassacao": {
        "label": "Cassação",
        "economico": (
            "recurso cassação cnh",
            "advogado cassação cnh",
            "cnh cassada",
        ),
        "completo": (
            "recurso cassação cnh",
            "advogado cassação cnh",
            "cnh cassada",
            "defesa cassação carteira",
            "processo cassação cnh",
            "recorrer cassação direito de dirigir",
            "dirigir com cnh suspensa cassação",
            "como recuperar cnh cassada",
        ),
    },
    "ppd": {
        "label": "PPD",
        "economico": (
            "recurso perda ppd",
            "advogado ppd",
            "permissão para dirigir multa",
        ),
        "completo": (
            "recurso perda ppd",
            "advogado ppd",
            "permissão para dirigir multa",
            "defesa ppd",
            "multa grave na ppd",
            "perdi a permissão para dirigir",
            "recorrer multa carteira provisória",
            "cassação carteira provisória",
        ),
    },
}

SERVICE_ALIASES = {
    "recusa ao bafometro": "lei seca",
    "recusa bafometro": "lei seca",
    "suspensao da cnh": "suspensao",
    "cassacao da cnh": "cassacao",
}


def _normalizar(valor: str) -> str:
    texto = unicodedata.normalize("NFKD", valor.strip().casefold())
    texto = texto.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", texto)


def _csv_unico(valor: str) -> list[str]:
    itens: list[str] = []
    vistos: set[str] = set()
    for item in valor.split(","):
        item_limpo = item.strip()
        chave = _normalizar(item_limpo)
        if item_limpo and chave not in vistos:
            vistos.add(chave)
            itens.append(item_limpo)
    return itens


def criar_plano_busca(
    service: str,
    locations: str,
    devices: str,
    mode: str,
) -> dict:
    chave_recebida = _normalizar(service)
    chave_servico = SERVICE_ALIASES.get(chave_recebida, chave_recebida)
    pack = SEARCH_PACKS.get(chave_servico)
    if pack is None:
        suportados = ", ".join(item["label"] for item in SEARCH_PACKS.values())
        raise ValueError(f"Serviço não suportado. Use um destes: {suportados}.")
    if mode not in {"economico", "completo"}:
        raise ValueError("mode deve ser economico ou completo.")

    locais = _csv_unico(locations)
    dispositivos = [_normalizar(item) for item in _csv_unico(devices)]
    if not locais:
        raise ValueError("Informe ao menos uma localização.")
    if not dispositivos:
        raise ValueError("Informe ao menos um dispositivo.")
    invalidos = [item for item in dispositivos if item not in {"mobile", "desktop"}]
    if invalidos:
        raise ValueError("Dispositivos aceitos: mobile e desktop.")

    combinacoes_base = len(locais) * len(dispositivos)
    if combinacoes_base > MAX_CREDITS_PER_PLAN:
        raise ValueError(
            "Locais e dispositivos excedem o limite de 24 consultas, "
            "mesmo usando apenas uma palavra-chave."
        )

    palavras_disponiveis = list(pack[mode])
    maximo_palavras = MAX_CREDITS_PER_PLAN // combinacoes_base
    palavras_usadas = palavras_disponiveis[:maximo_palavras]
    palavras_omitidas = palavras_disponiveis[maximo_palavras:]

    matriz = [
        {
            "index": indice,
            "service": pack["label"],
            "keyword": palavra,
            "location": local,
            "device": dispositivo,
            "estimated_credits": 1,
        }
        for indice, (palavra, local, dispositivo) in enumerate(
            product(palavras_usadas, locais, dispositivos), start=1
        )
    ]

    return {
        "service": pack["label"],
        "mode": mode,
        "locations": locais,
        "devices": dispositivos,
        "keywords": palavras_usadas,
        "omitted_keywords": palavras_omitidas,
        "matrix": matriz,
        "estimated_credits": len(matriz),
        "max_credits": MAX_CREDITS_PER_PLAN,
        "limited": bool(palavras_omitidas),
        "methodology": (
            "A estimativa considera um crédito por consulta. O plano limita a matriz "
            "a 24 consultas e não executa nenhuma busca."
        ),
    }
