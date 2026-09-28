# Kitchen On Wheels — web

Statický web pro street food burgery **Kitchen On Wheels** (Roudnice nad Labem).
Žádný build, čisté HTML + CSS + JS.

## Struktura

```
kitchen-on-wheels/
├── index.html
├── assets/
└── README.md
```

## Lokální spuštění

```bash
python -m http.server 5196 --directory kitchen-on-wheels
```

Pak otevřít http://localhost:5196 (v `.claude/launch.json` konfigurace `kitchen-on-wheels`).

## Nasazení

[Netlify Drop](https://app.netlify.com/drop) — přetáhnout celou složku `kitchen-on-wheels/`.
