import './style.css'

interface Veiculo {
  id?: number
  placa: string
  modelo: string
  marca: string
  ano: number
}

interface ResultadoValidacaoPlaca {
  valida: boolean
  formato: string
  mensagem: string
}

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>
      veiculos: {
        listar: () => Promise<Veiculo[]>
        criar: (veiculo: Veiculo) => Promise<Veiculo>
        atualizar: (veiculo: Veiculo) => Promise<Veiculo>
        excluir: (id: number) => Promise<{ sucesso: boolean }>
      }
      validarPlaca: (placa: string) => Promise<ResultadoValidacaoPlaca>
    }
  }
}

const appElement = document.getElementById('app') as HTMLDivElement

appElement.innerHTML = `
  <h1>Gestão de Veículos</h1>
  <button id="btn-criar">Criar Veículo de Teste</button>
  <button id="btn-listar">Listar Veículos</button>
  <ul id="lista-veiculos"></ul>

  <hr />

  <h2>Validar Placa</h2>
  <input id="input-placa" type="text" placeholder="Ex: ABC1D23" />
  <button id="btn-validar-placa">Validar</button>
  <p id="resultado-placa">Aguardando validação...</p>
`

const btnCriar = document.getElementById('btn-criar') as HTMLButtonElement
const btnListar = document.getElementById('btn-listar') as HTMLButtonElement
const lista = document.getElementById('lista-veiculos') as HTMLUListElement

btnCriar.addEventListener('click', async () => {
  try {
    const novo = await window.api.veiculos.criar({
      placa: 'ABC' + Math.floor(Math.random() * 9999),
      modelo: 'Hilux',
      marca: 'Toyota',
      ano: 2022,
    })
    console.log('Veículo criado:', novo)
    await carregarVeiculos()
  } catch (erro) {
    console.error('Erro ao criar veículo:', erro)
  }
})

btnListar.addEventListener('click', carregarVeiculos)

async function carregarVeiculos() {
  const veiculos = await window.api.veiculos.listar()
  lista.innerHTML = veiculos
    .map((v) => `<li>${v.placa} - ${v.marca} ${v.modelo} (${v.ano})</li>`)
    .join('')
}

const inputPlaca = document.getElementById('input-placa') as HTMLInputElement
const btnValidarPlaca = document.getElementById('btn-validar-placa') as HTMLButtonElement
const resultadoPlaca = document.getElementById('resultado-placa') as HTMLParagraphElement

btnValidarPlaca.addEventListener('click', async () => {
  const placa = inputPlaca.value
  if (!placa) {
    resultadoPlaca.textContent = 'Digite uma placa antes de validar.'
    return
  }

  try {
    const resultado = await window.api.validarPlaca(placa)
    resultadoPlaca.textContent = resultado.mensagem
    resultadoPlaca.style.color = resultado.valida ? '#4ade80' : '#f87171'
  } catch (erro) {
    resultadoPlaca.textContent = 'Erro ao validar placa.'
    console.error(erro)
  }
})

export {}