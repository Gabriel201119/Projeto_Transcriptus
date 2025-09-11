# 🚀 Guia Completo de Deploy - Transcriptus

## 📋 **Pré-requisitos**

### **1. Conta em Plataforma de Hosting**
- **Recomendado:** Railway, Render, Heroku, ou Vercel
- **Alternativa:** VPS (DigitalOcean, Linode, AWS EC2)

### **2. Banco de Dados**
- **PostgreSQL** (Railway, Supabase, ou Neon)
- **MongoDB Atlas** (alternativa)

### **3. Variáveis de Ambiente**
- Chaves de API (Bing Translate, Gemini)
- URL do banco de dados
- JWT Secret

---

## 🎯 **Opção 1: Deploy no Railway (Recomendado)**

### **Passo 1: Preparar o Projeto**

1. **Criar arquivo `railway.json`:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Criar arquivo `Procfile`:**
```
web: npm start
```

3. **Atualizar `package.json`:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "npm install",
    "postinstall": "npx prisma generate && npx prisma db push"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
```

### **Passo 2: Configurar Railway**

1. **Acesse:** [railway.app](https://railway.app)
2. **Conecte sua conta GitHub**
3. **Clique em "New Project" → "Deploy from GitHub repo"**
4. **Selecione seu repositório**

### **Passo 3: Configurar Banco de Dados**

1. **No Railway Dashboard:**
   - Clique em "New" → "Database" → "PostgreSQL"
   - Anote as credenciais geradas

2. **Configurar variáveis de ambiente:**
```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=sua_chave_secreta_aqui
BING_TRANSLATE_API_KEY=sua_chave_bing
GEMINI_API_KEY=sua_chave_gemini
NODE_ENV=production
PORT=3000
```

### **Passo 4: Deploy**

1. **Railway fará o deploy automaticamente**
2. **Acesse o link gerado**
3. **Configure domínio personalizado (opcional)**

---

## 🎯 **Opção 2: Deploy no Render**

### **Passo 1: Preparar o Projeto**

1. **Criar arquivo `render.yaml`:**
```yaml
services:
  - type: web
    name: transcriptus
    env: node
    plan: free
    buildCommand: npm install && npx prisma generate && npx prisma db push
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: transcriptus-db
          property: connectionString
```

### **Passo 2: Configurar Render**

1. **Acesse:** [render.com](https://render.com)
2. **Conecte GitHub**
3. **New → Web Service**
4. **Selecione repositório**

### **Passo 3: Configurar Banco**

1. **New → PostgreSQL**
2. **Configure variáveis de ambiente**
3. **Deploy**

---

## 🎯 **Opção 3: Deploy no Heroku**

### **Passo 1: Instalar Heroku CLI**

```bash
# Windows (PowerShell)
winget install Heroku.HerokuCLI

# macOS
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### **Passo 2: Preparar Projeto**

1. **Criar `Procfile`:**
```
web: npm start
```

2. **Atualizar `package.json`:**
```json
{
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "npx prisma generate && npx prisma db push"
  },
  "engines": {
    "node": "18.x",
    "npm": "8.x"
  }
}
```

### **Passo 3: Deploy**

```bash
# Login
heroku login

# Criar app
heroku create transcriptus-app

# Adicionar PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Configurar variáveis
heroku config:set JWT_SECRET=sua_chave_secreta
heroku config:set BING_TRANSLATE_API_KEY=sua_chave_bing
heroku config:set GEMINI_API_KEY=sua_chave_gemini
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Abrir app
heroku open
```

---

## 🎯 **Opção 4: Deploy no VPS (Ubuntu)**

### **Passo 1: Configurar Servidor**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install nginx -y
```

### **Passo 2: Configurar Banco de Dados**

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE transcriptus;
CREATE USER transcriptus_user WITH PASSWORD 'sua_senha_forte';
GRANT ALL PRIVILEGES ON DATABASE transcriptus TO transcriptus_user;
\q
```

### **Passo 3: Deploy da Aplicação**

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/transcriptus.git
cd transcriptus

# Instalar dependências
npm install

# Configurar variáveis de ambiente
nano .env
```

**Conteúdo do `.env`:**
```env
DATABASE_URL=postgresql://transcriptus_user:sua_senha_forte@localhost:5432/transcriptus
JWT_SECRET=sua_chave_secreta_muito_forte
BING_TRANSLATE_API_KEY=sua_chave_bing
GEMINI_API_KEY=sua_chave_gemini
NODE_ENV=production
PORT=3000
```

```bash
# Gerar Prisma
npx prisma generate
npx prisma db push

# Iniciar com PM2
pm2 start server.js --name transcriptus
pm2 startup
pm2 save
```

### **Passo 4: Configurar Nginx**

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/transcriptus
```

**Conteúdo:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/transcriptus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔧 **Configurações Adicionais**

### **1. Configurar Domínio Personalizado**

**Railway/Render:**
- Dashboard → Settings → Domains
- Adicionar domínio personalizado

**VPS:**
- Configurar DNS no seu provedor
- Apontar para IP do servidor

### **2. SSL/HTTPS**

**Railway/Render:** Automático
**VPS:**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d seu-dominio.com
```

### **3. Backup do Banco**

**PostgreSQL:**
```bash
# Backup
pg_dump -h localhost -U transcriptus_user transcriptus > backup.sql

# Restore
psql -h localhost -U transcriptus_user transcriptus < backup.sql
```

---

## 🚨 **Troubleshooting**

### **Problemas Comuns:**

1. **Erro de conexão com banco:**
   - Verificar `DATABASE_URL`
   - Verificar se banco está rodando

2. **Erro de dependências:**
   - Verificar `package.json`
   - Executar `npm install`

3. **Erro de Prisma:**
   - Executar `npx prisma generate`
   - Executar `npx prisma db push`

4. **Erro de porta:**
   - Verificar se `PORT` está configurado
   - Verificar se porta está disponível

### **Logs:**

**Railway/Render:** Dashboard → Logs
**VPS:**
```bash
pm2 logs transcriptus
pm2 monit
```

---

## 📊 **Monitoramento**

### **1. Uptime Monitoring**
- **UptimeRobot** (gratuito)
- **Pingdom** (pago)

### **2. Performance**
- **New Relic** (gratuito até 100GB)
- **DataDog** (pago)

### **3. Logs**
- **LogRocket** (pago)
- **Sentry** (gratuito até 5k eventos)

---

## 🎉 **Conclusão**

Após seguir este guia, sua aplicação Transcriptus estará:

✅ **Online e acessível**
✅ **Com banco de dados configurado**
✅ **Com SSL/HTTPS**
✅ **Com monitoramento básico**
✅ **Pronta para produção**

**Recomendação:** Comece com Railway ou Render para simplicidade, depois migre para VPS se precisar de mais controle.

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs
2. Consulte a documentação da plataforma
3. Verifique as variáveis de ambiente
4. Teste localmente primeiro

**Boa sorte com seu deploy! 🚀**

