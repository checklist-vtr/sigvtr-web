# SIGVTR
### Sistema de Gestão e Checklist de Viaturas

Sistema web responsivo desenvolvido para auxiliar o controle operacional de viaturas policiais, permitindo o registro eletrônico do checklist de retirada, acompanhamento de avarias e histórico operacional.

---

## Objetivo

Substituir o checklist em papel por um sistema simples, rápido e acessível pelo navegador do celular, sem necessidade de instalação obrigatória.

O projeto foi desenvolvido priorizando:

- rapidez no preenchimento;
- funcionamento em Android e iPhone;
- interface amigável;
- baixo consumo de internet;
- possibilidade de instalação como PWA;
- utilização gratuita utilizando serviços Google.

---

# Tecnologias

Frontend

- HTML5
- CSS3
- JavaScript (Vanilla)

Backend

- Google Apps Script
- Google Sheets

Armazenamento

- Google Drive (Fotos)

Hospedagem

- GitHub Pages

Controle de versão

- GitHub

---

# Estrutura do Projeto

```
sigvtr/

│
├── assets/
│   ├── icons/
│   ├── images/
│   └── logo/
│
├── css/
│   └── style.css
│
├── js/
│   └── app.js
│
├── index.html
├── manifest.json
├── sw.js
└── README.md
```

---

# Funcionalidades atuais

## Identificação da Viatura

- Prefixo da VTR
- Data
- Posto / Graduação
- RG PMPA
- Turno
- KM
- Equipe

---

## Checklist

Itens obrigatórios

- Placas
- Giroflex
- Sirene
- Pneus
- Rádio
- Estepe
- Macaco
- Triângulo
- Retrovisor esquerdo
- Retrovisor direito
- Faróis
- Lanternas
- Freios
- Limpadores

Cada item possui:

- Sem alteração
- Com alteração

Caso exista alteração:

- descrição obrigatória.

---

## Fotografias

Registro obrigatório de:

- lado esquerdo
- lado direito
- painel / odômetro

---

## Registro Técnico

Ao enviar o checklist são gravados:

- data
- hora
- navegador
- dispositivo
- protocolo
- usuário
- JSON completo do checklist

---

# Controle de Avarias

Uma avaria registrada permanece ativa até que seja encerrada pela administração.

Exemplo:

```
50-2008

Farol dianteiro esquerdo quebrado
```

Os próximos condutores visualizarão esta avaria antes do checklist.

Ela não será registrada novamente.

Somente novas avarias serão adicionadas ao sistema.

---

# Fluxo

```
Condutor

↓

Identificação

↓

Checklist

↓

Fotos

↓

Envio

↓

Google Apps Script

↓

Google Sheets

↓

Google Drive

↓

Administração
```

---

# Banco de Dados

Planilhas utilizadas

- CONFIG
- USUARIOS
- VIATURAS
- RETIRADAS
- EVENTOS
- AVARIAS
- FOTOS
- LOGS
- CHECKLIST_ITEMS

---

# PWA

O sistema pode ser instalado na tela inicial do dispositivo.

Recursos

- funcionamento offline parcial
- cache inteligente
- atualização automática
- interface mobile

---

# Próximas Implementações

- Login dos usuários
- Assinatura digital
- Consulta de avarias antes da retirada
- Painel administrativo
- Dashboard operacional
- Histórico por viatura
- Histórico por policial
- Upload otimizado das fotografias
- Notificações
- Relatórios PDF
- Exportação Excel
- Controle de manutenção
- Controle de combustível
- Geolocalização (opcional)

---

# Licença

Projeto privado.

Uso interno.

20º Batalhão da Polícia Militar do Pará.

Todos os direitos reservados.

© 2026

---

# Autor

Desenvolvido por

**Mizael Nunes**

Projeto SIGVTR

Sistema de Gestão de Viaturas

Versão inicial: 1.0
## Checklist Mobile v1.7.0

O checklist principal utiliza o `index.html` da raiz e foi organizado em 12 etapas:

1. Identificação
2. Pneus e Rodas
3. Iluminação e Faróis
4. Sinalização e Comunicação
5. Lataria Externa
6. Vidros, Limpadores e Retrovisores
7. Cabine
8. Compartimento de Detidos (Xadrez)
9. Equipamentos Obrigatórios
10. Mecânica e Segurança
11. Fotos e Confirmação
12. Resumo e Envio

A interface mantém o contrato atual com o Google Apps Script e a tela final de protocolo. Durante o envio, o usuário acompanha uma sequência visual de processamento para evitar a percepção de travamento.
