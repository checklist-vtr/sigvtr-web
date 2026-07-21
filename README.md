# SIGVTR
## Sistema Integrado de Gestão de Viaturas

![Versão](https://img.shields.io/badge/version-0.1.0-blue)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Licença](https://img.shields.io/badge/license-MIT-green)

---

## Sobre

O **SIGVTR (Sistema Integrado de Gestão de Viaturas)** é uma aplicação web desenvolvida para modernizar o processo de gestão de viaturas operacionais.

O sistema substitui controles manuais por uma plataforma digital responsiva, acessível por smartphones, tablets e computadores.

Inicialmente foi concebido para utilização no **20º Batalhão da Polícia Militar do Pará**, porém sua arquitetura foi desenvolvida para permitir adaptação a qualquer Organização Policial Militar (OPM).

---

# Objetivos

- Digitalizar a retirada de viaturas;
- Eliminar formulários em papel;
- Registrar checklist operacional;
- Registrar avarias;
- Registrar eventos;
- Gerenciar substituições de guarnição;
- Gerar relatórios;
- Produzir indicadores;
- Armazenar histórico completo das viaturas;
- Manter trilha de auditoria (logs).

---

# Tecnologias

Frontend

- HTML5
- CSS3
- JavaScript ES6+

Backend

- Google Apps Script

Banco de Dados

- Google Sheets

Armazenamento

- Google Drive

Hospedagem

- GitHub Pages

Controle de Versão

- Git

Repositório

- GitHub

---

# Arquitetura

SIGVTR utiliza arquitetura modular inspirada em MVC Lite.

```
Interface
        ↓
Controllers
        ↓
Services
        ↓
Google Apps Script
        ↓
Google Sheets
```

---

# Estrutura

```
SIGVTR/

assets/

components/

css/

docs/

js/

pages/

tests/

index.html

manifest.json

sw.js
```

---

# Funcionalidades

✔ Login

✔ Dashboard

✔ Cadastro de usuários

✔ Cadastro de viaturas

✔ Retirada de viaturas

✔ Checklist

✔ Registro fotográfico

✔ Registro de eventos

✔ Substituição de guarnição

✔ Administração

✔ Logs

✔ Relatórios

✔ Exportação PDF

✔ PWA

---

# Fluxo operacional

Retirada

↓

Checklist

↓

Fotos

↓

Assinatura

↓

Operação

↓

Evento (opcional)

↓

Nova retirada

↓

Novo checklist

---

# Identidade Visual

Fonte

- Inter

Ícones

- Material Symbols

Paleta

- Azul institucional
- Branco
- Cinza claro
- Verde (sucesso)
- Vermelho (erro)

---

# Compatibilidade

✔ Android

✔ iPhone

✔ Tablets

✔ Desktop

---

# Responsividade

O sistema foi desenvolvido utilizando abordagem Mobile First.

---

# Segurança

- Comunicação HTTPS
- Controle de usuários
- Auditoria de operações
- Registro de logs
- Controle de permissões
- Versionamento

---

# Roadmap

Versão 0.1

- Estrutura do projeto
- UI Kit
- Home
- PWA

Versão 0.2

- Login

Versão 0.3

- Cadastro de Usuários

Versão 0.4

- Cadastro de Viaturas

Versão 0.5

- Retirada

Versão 0.6

- Checklist

Versão 0.7

- Eventos

Versão 0.8

- Administração

Versão 0.9

- Dashboard

Versão 1.0

- Relatórios
- PDF
- Auditoria
- Logs

---

# Licença

MIT License

---

# Autor

Projeto SIGVTR

Sistema Integrado de Gestão de Viaturas

2026