# Renomeia "Solicitação de compra" para "Ordem de compra" nos textos das telas de
# Suprimentos (pt-BR, en-US, es-ES). Relatórios e Dashboards ficam de fora (regra do repo).
# Uso único (fim da OS, 24/11/2026): python scripts/ux-docs/rename-ordem-compra.py
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2] / "src" / "constants" / "languages"
FILES = [
    "languageRequestPurchases.ts",
    "languageRequestAuthorizations.ts",
    "languageRequestAuthorizers.ts",
    "languageRequestReceipts.ts",
    "languageSupplyStatusSlas.ts",
]
RULES = {
    "languagePtBr": [
        ("Solicitação de Compras", "Ordens de Compra"),
        ("Solicitações de Compra", "Ordens de Compra"),
        ("Solicitações de compra", "Ordens de compra"),
        ("solicitações de compra", "ordens de compra"),
        ("Nova Solicitação de Compra", "Nova Ordem de Compra"),
        ("Solicitação de Compra", "Ordem de Compra"),
        ("Solicitação de compra", "Ordem de compra"),
        ("solicitação de compra", "ordem de compra"),
        ("'Nova Solicitação'", "'Nova Ordem de Compra'"),
    ],
    "languageEnUs": [
        ("Purchase Requests", "Purchase Orders"),
        ("Purchase requests", "Purchase orders"),
        ("purchase requests", "purchase orders"),
        ("Purchase Request", "Purchase Order"),
        ("Purchase request", "Purchase order"),
        ("purchase request", "purchase order"),
        ("'New Request'", "'New Purchase Order'"),
    ],
    "languageEsEs": [
        ("Solicitudes de Compra", "Órdenes de Compra"),
        ("Solicitudes de compra", "Órdenes de compra"),
        ("solicitudes de compra", "órdenes de compra"),
        ("Nueva Solicitud de Compra", "Nueva Orden de Compra"),
        ("Solicitud de Compra", "Orden de Compra"),
        ("Solicitud de compra", "Orden de compra"),
        ("solicitud de compra", "orden de compra"),
        ("'Nueva Solicitud'", "'Nueva Orden de Compra'"),
    ],
}

# Segunda passada (pt-BR, só o módulo da ordem de compra): "solicitação" solta.
# O status 1 ("Solicitação", etapa do fluxo) fica como está.
RULES_PT_MODULE = [
    ("Sub Solicitação", "Sub Ordem de Compra"),
    ("Data da Solicitação", "Data da Ordem de Compra"),
    ("Ver Solicitação", "Ver Ordem de Compra"),
    ("Transferir Solicitação", "Transferir Ordem de Compra"),
    ("Status da Solicitação", "Status da Ordem de Compra"),
    ("'Solicitação recebida", "'Ordem de compra recebida"),
    ("'Solicitação transferida", "'Ordem de compra transferida"),
    ("'Solicitação finalizada", "'Ordem de compra finalizada"),
    ("'Solicitação {code}", "'Ordem de compra {code}"),
    ("Nenhuma solicitação", "Nenhuma ordem de compra"),
    ("da solicitação", "da ordem de compra"),
    ("de solicitação", "de ordem de compra"),
    ("esta solicitação", "esta ordem de compra"),
    ("Itens da Solicitação", "Itens da Ordem de Compra"),
    ("Sub solicitação", "Sub ordem de compra"),
    ("sub solicitação", "sub ordem de compra"),
    ("Receber Solicitação", "Receber Ordem de Compra"),
    ("'Solicitação alterada", "'Ordem de compra alterada"),
    ("Etapa da Solicitação", "Etapa da Ordem de Compra"),
    ("solicitação(ões) foram negada(s)", "ordem(ns) de compra foram negada(s)"),
]
pt_module = ROOT / "languagePtBr" / "languageRequestPurchases.ts"
_text = pt_module.read_text(encoding="utf-8")
_new = _text
for old, rep in RULES_PT_MODULE:
    _new = _new.replace(old, rep)
if _new != _text:
    pt_module.write_text(_new, encoding="utf-8", newline="")
    print("languagePtBr/languageRequestPurchases.ts (2a passada): ok")

for lang, rules in RULES.items():
    for name in FILES:
        path = ROOT / lang / name
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        new = text
        for old, rep in rules:
            new = new.replace(old, rep)
        if new != text:
            path.write_text(new, encoding="utf-8", newline="")
            changed = sum(1 for a, b in zip(text.splitlines(), new.splitlines()) if a != b)
            print(f"{lang}/{name}: {changed} linhas")
