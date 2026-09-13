# Деплой Cheburcoin на свой VPS

Фронт (Next.js SSR + API-роуты) едет на российский VPS за Caddy; выкат — через
GitHub Actions на пуш в `master`. Бек `tbank-api` не трогаем (живёт на Vercel,
фронт ходит к нему по `*.vercel.app` из браузера).

## Как это устроено

```
push master → GitHub Actions (npm ci → build → упаковка standalone)
            → scp bundle на VPS → распаковка в releases/<ts> → ln -sfn current
            → sudo systemctl restart cheburcoin

VPS:  Caddy (443, TLS Let's Encrypt) → 127.0.0.1:3000 (Node server.js под systemd)
```

- **Caddy** — HTTPS и обратный прокси (`deploy/Caddyfile` → `/etc/caddy/Caddyfile`).
- **systemd** — держит Node живым (`deploy/cheburcoin.service` → `/etc/systemd/system/`).
- **GitHub Actions** — сборка и выкат (`.github/workflows/deploy.yml`).
- Релизы по папкам `releases/<timestamp>` + симлинк `current` → мгновенный откат.

---

## 1. Разовая настройка VPS (Ubuntu 24.04)

Заходим по SSH под root (пароль пришёл на email при создании сервера):

```bash
ssh root@195.133.61.198
```

### 1.1. Пользователь для приложения (не под root!)

```bash
adduser --disabled-password --gecos "" deploy
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
# сюда вставить ПУБЛИЧНЫЙ ключ деплоя (создание ключа — в разделе 3):
nano /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### 1.2. Node 20 (системно, чтобы путь был /usr/bin/node)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v   # v20.x
```

### 1.3. Caddy

```bash
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy
```

### 1.4. Структура папок и рантайм-секреты

```bash
mkdir -p /home/deploy/cheburcoin/releases /home/deploy/cheburcoin/shared
# создать shared/.env по образцу deploy/env.server.example и заполнить ключами:
nano /home/deploy/cheburcoin/shared/.env
chmod 600 /home/deploy/cheburcoin/shared/.env
chown -R deploy:deploy /home/deploy/cheburcoin
```

### 1.5. systemd-юнит

```bash
# скопировать содержимое deploy/cheburcoin.service в файл на сервере:
nano /etc/systemd/system/cheburcoin.service
systemctl daemon-reload
systemctl enable cheburcoin      # автозапуск при ребуте (пока НЕ start — нет релиза)
```

### 1.6. Разрешить deploy перезапуск сервиса без пароля

Чтобы шаг выката `sudo systemctl restart cheburcoin` не требовал пароль:

```bash
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart cheburcoin' > /etc/sudoers.d/deploy-cheburcoin
chmod 440 /etc/sudoers.d/deploy-cheburcoin
```

Правило узкое: только рестарт одного сервиса, ничего больше.

### 1.7. Caddy-конфиг и фаервол

```bash
nano /etc/caddy/Caddyfile        # содержимое из deploy/Caddyfile
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```

Пока DNS не переключён — используем ВРЕМЕННЫЙ блок по IP из Caddyfile (см. комментарий
в файле), чтобы проверить приложение до переезда домена.

---

## 2. Ключ деплоя (SSH)

Отдельная пара ключей ТОЛЬКО для деплоя (не переиспользуй личный):

```bash
ssh-keygen -t ed25519 -C "github-deploy-cheburcoin" -f ./deploy_key -N ""
```

- **Публичный** `deploy_key.pub` → в `/home/deploy/.ssh/authorized_keys` на сервере (шаг 1.1).
- **Приватный** `deploy_key` → в GitHub Secret `SSH_PRIVATE_KEY` (см. ниже).

---

## 3. GitHub Secrets

Repo → Settings → Secrets and variables → Actions → New repository secret.

### Доступ к серверу
| Secret | Значение |
|---|---|
| `SSH_HOST` | `195.133.61.198` |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | содержимое приватного `deploy_key` (целиком, с BEGIN/END) |

### Build-time (`NEXT_PUBLIC_*`) — запекаются в бандл при сборке
| Secret |
|---|
| `NEXT_PUBLIC_MOEX_API` |
| `NEXT_PUBLIC_TINKOFF_API` |
| `NEXT_PUBLIC_COINGECKO_API` |
| `NEXT_PUBLIC_SOLANA_RPC` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDER_ID` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` |

> Значения возьми из локального `.env.local`. Серверные секреты (`COINGECKO_KEY`,
> `BYBIT_*`, `BLOCKBOOK*` и т.д.) в GitHub НЕ кладём — они живут в `shared/.env` на VPS.

---

## 4. Первый выкат и проверка

1. Смёржить эту ветку в `master` → workflow **Deploy to VPS** запустится сам
   (или Actions → Deploy to VPS → Run workflow).
2. На сервере проверить:
   ```bash
   systemctl status cheburcoin
   journalctl -u cheburcoin -n 50 --no-pager
   curl -I http://127.0.0.1:3000        # 200/307 — Node отвечает
   ```
3. Проверить снаружи по временному IP-блоку Caddy (см. Caddyfile).

## 5. Переключение домена

1. Понизить TTL A-записи `cheburcoin.ru`, затем указать её на `195.133.61.198`
   (в Cloudflare — режим **DNS only**, серое облако; или увести DNS к РФ-регистратору).
2. В Caddyfile вернуть блок домена (закомментировать IP-блок), `systemctl reload caddy`
   — Caddy сам выпишет сертификат.
3. **Прогнать `cheburcoin.ru` через CHEBURCHECK** — подтвердить, что домен на новом IP
   открывается из РФ (проверка SNI-блока, см. основную переписку).
4. Добавить `cheburcoin.ru` в Firebase → Authentication → Authorized domains.

## Полезное

- Логи приложения: `journalctl -u cheburcoin -f`
- Логи Caddy: `journalctl -u caddy -f`
- Откат на прошлый релиз:
  ```bash
  ls -1dt /home/deploy/cheburcoin/releases/*/   # выбрать предыдущий
  ln -sfn /home/deploy/cheburcoin/releases/<prev> /home/deploy/cheburcoin/current
  sudo systemctl restart cheburcoin
  ```
- Если next/image ругается на отсутствие `sharp` — `npm i sharp` в проект (попадёт в бандл).
