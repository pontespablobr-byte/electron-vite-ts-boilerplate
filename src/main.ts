import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'
import { inicializarBanco } from './db'
import {
  listarVeiculos,
  criarVeiculo,
  atualizarVeiculo,
  excluirVeiculo,
  Veiculo,
} from './veiculos'
import {
  findAllMotoristas,
  findOneMotorista,
  createMotorista,
  updateMotorista,
  removeMotorista,
  CriarMotoristaDto,
  AtualizarMotoristaDto,
} from './Motorista'
import {
  findAllManutencoes,
  createManutencao,
  updateManutencao,
  removeManutencao,
  findManutencoesPorVeiculo,
  relatorioDespesasPorVeiculo,
  CriarManutencaoDto,
  AtualizarManutencaoDto,
} from './manutencoes'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    center: true,
    title: 'Gestão de Manutenção Preventiva e Corretiva de Veículos',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

function criarMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Gestão de Manutenção",
      submenu: [
        {
          label: "Sobre",
          click: () => {
            console.log("Gestão de Manutenção Preventiva e Corretiva de Veículos");
          },
        },
        { type: "separator" },
        { role: "quit", label: "Sair" },
      ],
    },
    {
      label: "Visualizar",
      submenu: [
        { role: "reload", label: "Recarregar" },
        { role: "toggleDevTools", label: "Ferramentas do Desenvolvedor" },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function registrarHandlersVeiculos() {
  ipcMain.handle('veiculos:listar', async () => {
    return await listarVeiculos()
  })

  ipcMain.handle('veiculos:criar', async (_evento, veiculo: Veiculo) => {
    return await criarVeiculo(veiculo)
  })

  ipcMain.handle('veiculos:atualizar', async (_evento, veiculo: Veiculo) => {
    return await atualizarVeiculo(veiculo)
  })

  ipcMain.handle('veiculos:excluir', async (_evento, id: number) => {
    await excluirVeiculo(id)
    return { sucesso: true }
  })
}

function registrarHandlersMotoristas() {
  ipcMain.handle('motoristas:listar', async () => {
    return await findAllMotoristas()
  })

  ipcMain.handle('motoristas:buscar', async (_evento, id: number) => {
    return await findOneMotorista(id)
  })

  ipcMain.handle('motoristas:criar', async (_evento, dto: CriarMotoristaDto) => {
    return await createMotorista(dto)
  })

  ipcMain.handle(
    'motoristas:atualizar',
    async (_evento, id: number, dto: AtualizarMotoristaDto) => {
      return await updateMotorista(id, dto)
    }
  )

  ipcMain.handle('motoristas:excluir', async (_evento, id: number) => {
    const sucesso = await removeMotorista(id)
    return { sucesso }
  })
}

export function registrarHandlersManutencoes() {
  ipcMain.handle('manutencoes:listar', async () => {
    return await findAllManutencoes()
  })

  ipcMain.handle('manutencoes:listarPorVeiculo', async (_evento, idVeiculo: number) => {
    return await findManutencoesPorVeiculo(idVeiculo)
  })

  ipcMain.handle('manutencoes:criar', async (_evento, dto: CriarManutencaoDto) => {
    return await createManutencao(dto)
  })

  ipcMain.handle(
    'manutencoes:atualizar',
    async (_evento, id: number, dto: AtualizarManutencaoDto) => {
      return await updateManutencao(id, dto)
    }
  )

  ipcMain.handle('manutencoes:excluir', async (_evento, id: number) => {
    const sucesso = await removeManutencao(id)
    return { sucesso }
  })

  ipcMain.handle('manutencoes:relatorioDespesas', async () => {
    return await relatorioDespesasPorVeiculo()
  })
}

interface ResultadoValidacaoPlaca {
  valida: boolean
  formato: string
  mensagem: string
}

function validarPlaca(placa: string): ResultadoValidacaoPlaca {
  const placaFormatada = placa.trim().toUpperCase()

  const regexAntigo = /^[A-Z]{3}[0-9]{4}$/
  const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/

  if (regexAntigo.test(placaFormatada)) {
    return {
      valida: true,
      formato: 'Antigo (ABC1234)',
      mensagem: `Placa ${placaFormatada} é válida no formato antigo.`,
    }
  }

  if (regexMercosul.test(placaFormatada)) {
    return {
      valida: true,
      formato: 'Mercosul (ABC1D23)',
      mensagem: `Placa ${placaFormatada} é válida no formato Mercosul.`,
    }
  }

  return {
    valida: false,
    formato: 'Desconhecido',
    mensagem: `Placa ${placaFormatada} não é válida em nenhum formato reconhecido.`,
  }
}

function registrarHandlerValidarPlaca() {
  ipcMain.handle('validar-placa', (_evento, placa: string): ResultadoValidacaoPlaca => {
    return validarPlaca(placa)
  })
}

app.whenReady().then(async () => {
  await inicializarBanco()
  createWindow()
  criarMenu()
  registrarHandlersVeiculos()
  registrarHandlersMotoristas()
  registrarHandlersManutencoes()
  registrarHandlerValidarPlaca()
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("before-quit", () => {
  console.log("Encerrando o Gestão de Manutenção. Ate logo!")
})