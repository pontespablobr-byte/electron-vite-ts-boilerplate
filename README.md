# electron-vite-ts-boilerplate

Projeto base mínimo para aplicações desktop com **Electron + Vite + TypeScript**, já com
comunicação entre processos (IPC) configurada de forma segura e empacotamento Windows
que dispensa privilégios de administrador.

O objetivo é ser um ponto de partida enxuto: nada de framework de interface, roteador ou
gerenciador de estado. Só o esqueleto funcionando, para você acrescentar o que precisar.

## Stack

| Peça | Papel |
|---|---|
| Electron | Runtime desktop (processo Main em Node.js, Renderer em Chromium) |
| Vite | Servidor de desenvolvimento e build do Renderer |
| `vite-plugin-electron` | Compila `main.ts` e `preload.ts` junto com o Vite |
| TypeScript | Modo `strict` ligado |
| `electron-builder` | Geração do instalador |
| `pg` e `dotenv` | Já declarados, para quem for conectar a um PostgreSQL |

As versões exatas estão fixadas no `package-lock.json`.

## Requisitos

Node.js 20 ou superior e npm.

## Uso

```bash
npm install
npm start          # desenvolvimento, com recarga automática do Renderer
npm run build      # verifica os tipos, gera o bundle e empacota o instalador
```

> **Windows com execução de scripts bloqueada por política:** se o PowerShell recusar
> `npm`, prefixe os comandos com `npx` em um prompt do CMD - `npx npm install`,
> `npx npm start`. O `npx` invoca o binário diretamente, sem passar pelo script `.ps1`
> que a política bloqueia.

## Estrutura

```text
src/
  main.ts         processo Main: cria a BrowserWindow e registra os canais IPC
  preload.ts      ponte entre os processos, via contextBridge
  renderer.ts     código da interface, executado no Chromium
  style.css       estilos da página
  vite-env.d.ts   tipos do cliente Vite
index.html        documento carregado pela janela
vite.config.ts    configuração do Vite e dos pontos de entrada do Electron
```

## O que já vem pronto

**IPC seguro.** O `preload.ts` expõe uma API mínima ao Renderer usando `contextBridge`,
com `contextIsolation: true` e `nodeIntegration: false`. O Renderer nunca recebe acesso
direto ao Node.js. O canal de exemplo (`canal-ping`) mostra o caminho completo de ida e
volta e serve de molde para os seus.

Para declarar um canal novo: registre o `ipcMain.handle` no `main.ts`, exponha o método
correspondente no `preload.ts` e acrescente a assinatura ao bloco `declare global` do
`renderer.ts`, para manter a tipagem de ponta a ponta.

**Alternância entre desenvolvimento e produção.** O `main.ts` decide entre `loadURL` e
`loadFile` conforme `process.env.VITE_DEV_SERVER_URL`: em desenvolvimento a janela aponta
para o servidor do Vite; no aplicativo empacotado, para o HTML já compilado.

**Instalador por usuário.** A configuração NSIS usa `perMachine: false` e
`requestedExecutionLevel: asInvoker`, então o instalador gerado não dispara o prompt de
UAC nem exige conta de administrador. Útil em máquinas corporativas ou compartilhadas.

## Personalização inicial

Ao começar um projeto a partir daqui, ajuste:

- `name` e `description` no `package.json`;
- `appId` e `productName` no bloco `build` do `package.json`;
- a tag `<title>` do `index.html` - ela **sobrescreve** a opção `title` passada à
  `BrowserWindow`, então mudar só no `main.ts` não altera a barra da janela.

## Observações

Alterações em `src/main.ts` não são recarregadas automaticamente: o Vite atualiza apenas
o Renderer. Depois de mexer no processo Main, reinicie a aplicação.

O `.gitignore` já cobre `node_modules/`, as saídas de build e o `.env`.
