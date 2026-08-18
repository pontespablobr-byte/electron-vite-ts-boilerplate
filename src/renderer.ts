import './style.css'

interface Veiculo {
  id?: number
  placa: string
  modelo: string
  marca: string
  ano: number
}

interface Motorista {
  id?: number
  nome: string
  cnh: string
  telefone: string
}

interface Manutencao {
  id?: number
  id_veiculo: number
  tipo_servico: string
  data: string
  quilometragem: number
  custo: number
}

interface DespesaPorVeiculo {
  id_veiculo: number
  placa: string
  total_gasto: number
  quantidade_manutencoes: number
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
      motoristas: {
        listar: () => Promise<Motorista[]>
        buscar: (id: number) => Promise<Motorista | null>
        criar: (motorista: Omit<Motorista, 'id'>) => Promise<Motorista>
        atualizar: (id: number, motorista: Partial<Omit<Motorista, 'id'>>) => Promise<Motorista | null>
        excluir: (id: number) => Promise<{ sucesso: boolean }>
      }
      manutencoes: {
        listar: () => Promise<Manutencao[]>
        listarPorVeiculo: (idVeiculo: number) => Promise<Manutencao[]>
        criar: (manutencao: Omit<Manutencao, 'id'>) => Promise<Manutencao>
        atualizar: (id: number, manutencao: Partial<Omit<Manutencao, 'id'>>) => Promise<Manutencao | null>
        excluir: (id: number) => Promise<{ sucesso: boolean }>
        relatorioDespesas: () => Promise<DespesaPorVeiculo[]>
      }
      validarPlaca: (placa: string) => Promise<ResultadoValidacaoPlaca>
    }
  }
}

const appElement = document.getElementById('app') as HTMLDivElement

appElement.insertAdjacentHTML(
  'beforeend',
  `
  <section class="secao">
    <h2>Motoristas</h2>
    <form id="form-motorista">
      <input id="m-nome" type="text" placeholder="Nome" required />
      <input id="m-cnh" type="text" placeholder="CNH" required />
      <input id="m-telefone" type="text" placeholder="Telefone" required />
      <button type="submit">Cadastrar Motorista</button>
    </form>
    <ul id="lista-motoristas"></ul>
  </section>

  <hr />

  <section class="secao">
    <h2>Manutenções</h2>
    <form id="form-manutencao">
      <select id="mn-veiculo" required></select>
      <input id="mn-tipo" type="text" placeholder="Tipo de serviço" required />
      <input id="mn-data" type="date" required />
      <input id="mn-km" type="number" placeholder="Quilometragem" required />
      <input id="mn-custo" type="number" step="0.01" placeholder="Custo (R$)" required />
      <button type="submit">Lançar Manutenção</button>
    </form>
    <ul id="lista-manutencoes"></ul>
  </section>

  <hr />

  <section class="secao">
    <h2>Relatório de Despesas por Veículo</h2>
    <button id="btn-relatorio">Gerar Relatório</button>
    <ul id="lista-relatorio"></ul>
  </section>

  <hr />

  <section class="secao">
    <h2>Validar Placa</h2>
    <input id="input-placa" type="text" placeholder="Ex: ABC1D23" />
    <button id="btn-validar-placa">Validar</button>
    <p id="resultado-placa">Aguardando validação...</p>
  </section>
  `
)

// ===================== VEÍCULOS =====================
// Estrutura em index.html. Aqui só cuidamos do que muda: carregar, validar,
// renderizar por código (sem innerHTML com dado externo) e filtrar no cliente.

const formVeiculo = document.getElementById('form-veiculo') as HTMLFormElement
const campoPlaca = document.getElementById('v-placa') as HTMLInputElement
const campoModelo = document.getElementById('v-modelo') as HTMLInputElement
const campoMarca = document.getElementById('v-marca') as HTMLInputElement
const campoAno = document.getElementById('v-ano') as HTMLInputElement
const erroVeiculo = document.getElementById('erro-veiculo') as HTMLParagraphElement
const formFiltroVeiculo = document.getElementById('form-filtro-veiculo') as HTMLFormElement
const filtroVeiculos = document.getElementById('filtro-veiculos') as HTMLInputElement
const erroFiltroVeiculo = document.getElementById('erro-filtro-veiculo') as HTMLParagraphElement
const statusVeiculos = document.getElementById('status-veiculos') as HTMLParagraphElement
const listaVeiculos = document.getElementById('lista-veiculos') as HTMLUListElement
const selectVeiculoManutencao = document.getElementById('mn-veiculo') as HTMLSelectElement

// Guarda em memória o que já foi carregado do Main, para o filtro não
// precisar chamar o IPC de novo a cada tecla digitada.
let veiculosCarregados: Veiculo[] = []

function limparErroVeiculo() {
  erroVeiculo.textContent = ''
}

function mostrarErroVeiculo(mensagem: string) {
  erroVeiculo.textContent = mensagem
}

function filtrarVeiculos(termo: string): Veiculo[] {
  const termoNormalizado = termo.trim().toLowerCase()
  if (!termoNormalizado) return veiculosCarregados

  return veiculosCarregados.filter((v) => {
    return (
      v.placa.toLowerCase().includes(termoNormalizado) ||
      v.marca.toLowerCase().includes(termoNormalizado) ||
      v.modelo.toLowerCase().includes(termoNormalizado)
    )
  })
}

function criarItemVeiculo(veiculo: Veiculo): HTMLLIElement {
  const item = document.createElement('li')

  const textoPrincipal = document.createElement('span')
  textoPrincipal.textContent = `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo} (${veiculo.ano})`

  const botaoExcluir = document.createElement('button')
  botaoExcluir.type = 'button'
  botaoExcluir.textContent = 'Excluir'
  botaoExcluir.addEventListener('click', async () => {
    if (veiculo.id === undefined) return
    try {
      await window.api.veiculos.excluir(veiculo.id)
      await carregarVeiculos()
    } catch (erro) {
      console.error('Erro ao excluir veículo:', erro)
      statusVeiculos.textContent = 'Não foi possível excluir o veículo.'
    }
  })

  item.appendChild(textoPrincipal)
  item.appendChild(botaoExcluir)
  return item
}

// Desfecho "não encontra": lista vazia (resposta vazia ou filtro sem match).
function renderizarListaVazia(mensagem: string) {
  while (listaVeiculos.firstChild) {
    listaVeiculos.removeChild(listaVeiculos.firstChild)
  }
  const item = document.createElement('li')
  item.className = 'item-vazio'
  item.textContent = mensagem
  listaVeiculos.appendChild(item)
}

// Desfecho "encontra": renderiza a lista recebida, item por item, via DOM.
function renderizarListaVeiculos(veiculos: Veiculo[]) {
  while (listaVeiculos.firstChild) {
    listaVeiculos.removeChild(listaVeiculos.firstChild)
  }

  if (veiculos.length === 0) {
    const filtroAtivo = filtroVeiculos.value.trim().length > 0
    renderizarListaVazia(
      filtroAtivo ? 'Nenhum veículo encontrado para esse filtro.' : 'Nenhum veículo cadastrado ainda.'
    )
    return
  }

  const fragmento = document.createDocumentFragment()
  veiculos.forEach((veiculo) => fragmento.appendChild(criarItemVeiculo(veiculo)))
  listaVeiculos.appendChild(fragmento)
}

function atualizarSelectVeiculoManutencao(veiculos: Veiculo[]) {
  while (selectVeiculoManutencao.firstChild) {
    selectVeiculoManutencao.removeChild(selectVeiculoManutencao.firstChild)
  }

  veiculos.forEach((veiculo) => {
    const opcao = document.createElement('option')
    opcao.value = String(veiculo.id ?? '')
    opcao.textContent = `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`
    selectVeiculoManutencao.appendChild(opcao)
  })
}

// Desfecho "encontra" / "não encontra" da carga inicial, vindos do canal
// veiculos:listar já existente (nenhum canal novo).
async function carregarVeiculos() {
  try {
    const veiculos = await window.api.veiculos.listar()
    veiculosCarregados = veiculos
    atualizarSelectVeiculoManutencao(veiculos)

    if (veiculos.length === 0) {
      statusVeiculos.textContent = 'Nenhum veículo cadastrado ainda.'
    } else {
      statusVeiculos.textContent = `${veiculos.length} veículo(s) carregado(s).`
    }

    renderizarListaVeiculos(filtrarVeiculos(filtroVeiculos.value))
  } catch (erro) {
    console.error('Erro ao carregar veículos:', erro)
    statusVeiculos.textContent = 'Não foi possível carregar os veículos.'
  }
}

// Filtro no cliente: reage ao input, esconde itens já carregados,
// sem chamar o IPC de novo.
filtroVeiculos.addEventListener('input', () => {
  erroFiltroVeiculo.textContent = ''
  renderizarListaVeiculos(filtrarVeiculos(filtroVeiculos.value))
})

// Form de verdade para o filtro: Enter não recarrega a página (preventDefault)
// e o parágrafo próprio de erro valida o termo antes de aplicar o filtro.
formFiltroVeiculo.addEventListener('submit', (evento) => {
  evento.preventDefault()

  const termo = filtroVeiculos.value.trim()
  if (termo.length === 1) {
    erroFiltroVeiculo.textContent = 'Digite pelo menos 2 caracteres para buscar.'
    return
  }

  erroFiltroVeiculo.textContent = ''
  renderizarListaVeiculos(filtrarVeiculos(termo))
})

formVeiculo.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  limparErroVeiculo()

  const placa = campoPlaca.value.trim()
  const modelo = campoModelo.value.trim()
  const marca = campoMarca.value.trim()
  const ano = Number(campoAno.value)

  if (!placa || !modelo || !marca || !campoAno.value) {
    mostrarErroVeiculo('Preencha placa, modelo, marca e ano antes de cadastrar.')
    return
  }

  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) {
    mostrarErroVeiculo('Informe um ano válido.')
    return
  }

  try {
    // Desfecho "o Main recusa": se o canal rejeitar (ex.: placa duplicada),
    // cai no catch abaixo com uma mensagem própria, sem alert().
    await window.api.veiculos.criar({ placa, modelo, marca, ano })
    formVeiculo.reset()
    await carregarVeiculos()
  } catch (erro) {
    console.error('Erro ao criar veículo:', erro)
    const mensagem = erro instanceof Error ? erro.message : 'Erro desconhecido ao cadastrar veículo.'
    mostrarErroVeiculo(
      mensagem.toLowerCase().includes('duplicate') || mensagem.toLowerCase().includes('unique')
        ? 'Já existe um veículo cadastrado com essa placa.'
        : 'Não foi possível cadastrar o veículo. Verifique os dados informados.'
    )
  }
})

// ===================== MOTORISTAS =====================

const formMotorista = document.getElementById('form-motorista') as HTMLFormElement
const listaMotoristas = document.getElementById('lista-motoristas') as HTMLUListElement

async function carregarMotoristas() {
  const motoristas = await window.api.motoristas.listar()

  listaMotoristas.innerHTML = motoristas
    .map(
      (m) => `
        <li>
          ${m.nome} - CNH: ${m.cnh} - Tel: ${m.telefone}
          <button data-excluir-motorista="${m.id}">Excluir</button>
        </li>
      `
    )
    .join('')

  listaMotoristas.querySelectorAll<HTMLButtonElement>('[data-excluir-motorista]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.excluirMotorista)
      await window.api.motoristas.excluir(id)
      await carregarMotoristas()
    })
  })
}

formMotorista.addEventListener('submit', async (evento) => {
  evento.preventDefault()

  const nome = (document.getElementById('m-nome') as HTMLInputElement).value
  const cnh = (document.getElementById('m-cnh') as HTMLInputElement).value
  const telefone = (document.getElementById('m-telefone') as HTMLInputElement).value

  try {
    await window.api.motoristas.criar({ nome, cnh, telefone })
    formMotorista.reset()
    await carregarMotoristas()
  } catch (erro) {
    console.error('Erro ao criar motorista:', erro)
    alert('Erro ao cadastrar motorista. Verifique se a CNH já existe.')
  }
})

// ===================== MANUTENÇÕES =====================

const formManutencao = document.getElementById('form-manutencao') as HTMLFormElement
const listaManutencoes = document.getElementById('lista-manutencoes') as HTMLUListElement

async function carregarManutencoes() {
  const manutencoes = await window.api.manutencoes.listar()

  listaManutencoes.innerHTML = manutencoes
    .map(
      (m) => `
        <li>
          Veículo #${m.id_veiculo} - ${m.tipo_servico} - ${m.data} -
          ${m.quilometragem} km - R$ ${Number(m.custo).toFixed(2)}
          <button data-excluir-manutencao="${m.id}">Excluir</button>
        </li>
      `
    )
    .join('')

  listaManutencoes.querySelectorAll<HTMLButtonElement>('[data-excluir-manutencao]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.excluirManutencao)
      await window.api.manutencoes.excluir(id)
      await carregarManutencoes()
    })
  })
}

formManutencao.addEventListener('submit', async (evento) => {
  evento.preventDefault()

  const id_veiculo = Number(selectVeiculoManutencao.value)
  const tipo_servico = (document.getElementById('mn-tipo') as HTMLInputElement).value
  const data = (document.getElementById('mn-data') as HTMLInputElement).value
  const quilometragem = Number((document.getElementById('mn-km') as HTMLInputElement).value)
  const custo = Number((document.getElementById('mn-custo') as HTMLInputElement).value)

  if (!id_veiculo) {
    alert('Cadastre um veículo antes de lançar uma manutenção.')
    return
  }

  try {
    await window.api.manutencoes.criar({ id_veiculo, tipo_servico, data, quilometragem, custo })
    formManutencao.reset()
    await carregarManutencoes()
  } catch (erro) {
    console.error('Erro ao criar manutenção:', erro)
    alert('Erro ao lançar manutenção.')
  }
})

// ===================== RELATÓRIO =====================

const btnRelatorio = document.getElementById('btn-relatorio') as HTMLButtonElement
const listaRelatorio = document.getElementById('lista-relatorio') as HTMLUListElement

btnRelatorio.addEventListener('click', async () => {
  const relatorio = await window.api.manutencoes.relatorioDespesas()

  listaRelatorio.innerHTML = relatorio
    .map(
      (r) => `
        <li>
          ${r.placa} - ${r.quantidade_manutencoes} manutenção(ões) -
          Total gasto: R$ ${Number(r.total_gasto).toFixed(2)}
        </li>
      `
    )
    .join('')
})

// ===================== VALIDAR PLACA =====================

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

// ===================== INICIALIZAÇÃO =====================

async function inicializar() {
  await carregarVeiculos()
  await carregarMotoristas()
  await carregarManutencoes()
}

inicializar()

export {}