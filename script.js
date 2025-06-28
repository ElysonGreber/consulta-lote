// Parâmetros da Tabela de Zoneamento
const zoneamentoData = {
    "ZR1": [1.5, 0.50, 0.30, 3, "5 m", "360 m²", "12 m"],
    "ZR2": [1.0, 0.50, 0.30, 2, "5 m", "360 m²", "12 m"],
    "ZR3": [1.0, 0.50, 0.30, 2, "5 m", "360 m²", "12 m"],
    "ZR4": [1.0, 0.50, 0.30, 2, "5 m", "360 m²", "12 m"],
    "ZR5": [1.0, 0.50, 0.30, 2, "5 m", "360 m²", "12 m"],
    "ZUM": [2.0, 0.70, 0.20, 6, "5 m", "300 m²", "12 m"],
    "ZC":  [3.0, 0.80, 0.15, 8, "5 m", "300 m²", "12 m"],
    "ZPI": [2.5, 0.60, 0.25, 6, "10 m", "1000 m²", "20 m"],
    "ZOE": [1.0, 0.50, 0.30, 3, "5 m", "500 m²", "15 m"],
    "ZPDS": [0.5, 0.20, 0.50, 2, "10 m", "2000 m²", "30 m"]
  };
  
  // Inicializa o mapa
  const map = L.map("map").setView([-25.4284, -49.2733], 16);
  
  // Camadas base
  const ortofoto2019 = L.esri.tiledMapLayer({
    url: "https://geocuritiba.ippuc.org.br/server/rest/services/Hosted/Ortofotos2019/MapServer"
  }).addTo(map);
  
  L.esri.dynamicMapLayer({
    url: "https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer",
    layers: [23, 15, 34],
    opacity: 0.8
  }).addTo(map);
  
  // Limpa marcadores e destaques
  let marcador;
  let camadaHighlight;
  
  // Lida com o formulário
  async function buscarLote(event) {
    event.preventDefault();
    const ifiscal = document.getElementById("inputIndicacaoFiscal").value.trim();
  
    if (!ifiscal) return;
  
    // Reset
    document.getElementById("html_basico").innerHTML = "";
    document.getElementById("html_calc").innerHTML = "";
    document.getElementById("html_lote").innerHTML = "";
    document.getElementById("html_extra").innerHTML = "";
  
    // Busca camada 15 (dados principais)
    const url15 = `https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/15/query?where=gtm_ind_fiscal='${ifiscal}'&outFields=*&f=json`;
    const dadosLote = await fetch(url15).then(r => r.json());
  
    if (!dadosLote.features || dadosLote.features.length === 0) {
      document.getElementById("mensagem").innerHTML = `<div class="alert alert-warning mt-3">Nenhum lote encontrado.</div>`;
      return;
    }
  
    const atributos = dadosLote.features[0].attributes;
  
    // Informações Básicas
    const camposBasicos = [
      ["Indicação Fiscal", atributos.gtm_ind_fiscal],
      ["Inscrição Imobiliária", atributos.gtm_insc_imob],
      ["Logradouro", atributos.gtm_nm_logradouro],
      ["Número", atributos.gtm_num_predial]
    ];
    document.getElementById("html_basico").innerHTML = gerarTabela(camposBasicos);
  
    // Cálculo de Potencial
    const zona = atributos.gtm_sigla_zoneamento?.trim();
    const area = parseFloat(atributos.gtm_mtr_area_terreno || 0);
  
    if (zoneamentoData[zona] && area > 0) {
      const [coef, taxaOcup, taxaPerm, alturaMax, recuo, areaMin, testadaMin] = zoneamentoData[zona];
      const construida = area * coef;
      const ocupada = area * taxaOcup;
      const permeavel = area * taxaPerm;
  
      const calc = [
        ["Zona", zona],
        ["Área do Lote (m²)", format(area)],
        ["Coef. de Aproveitamento", coef],
        ["Taxa de Ocupação", (taxaOcup * 100) + "%"],
        ["Taxa de Permeabilidade", (taxaPerm * 100) + "%"],
        ["Altura Máx. (Pav)", alturaMax],
        ["Área Máx. Construída (m²)", format(construida)],
        ["Área Máx. Ocupada (m²)", format(ocupada)],
        ["Área Mín. Permeável (m²)", format(permeavel)],
        ["Recuo Mínimo", recuo],
        ["Área Mínima do Lote", areaMin],
        ["Testada Mínima", testadaMin]
      ];
      document.getElementById("html_calc").innerHTML = gerarTabela(calc);
    }
  
    // Dados do Lote (todos campos)
    const dadosLoteArr = Object.entries(atributos);
    document.getElementById("html_lote").innerHTML = gerarTabela(dadosLoteArr);
  
    // Testadas - camada 20
    const url20 = `https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/20/query?where=gtm_ind_fiscal='${ifiscal}'&outFields=*&f=json`;
    const dadosExtra = await fetch(url20).then(r => r.json());
    if (dadosExtra.features && dadosExtra.features.length > 0) {
      let html = "";
      dadosExtra.features.forEach((f, i) => {
        const lista = Object.entries(f.attributes);
        html += `<h6>Registro ${i + 1}</h6>` + gerarTabela(lista);
      });
      document.getElementById("html_extra").innerHTML = html;
    }
  
    // Destaca geometriade camada 16
    if (camadaHighlight) camadaHighlight.remove();
  
    camadaHighlight = L.esri.featureLayer({
      url: "https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/16",
      where: `gtm_ind_fiscal = '${ifiscal}'`,
      style: {
        color: "red",
        weight: 3,
        fillOpacity: 0.1
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(`Indicação Fiscal: ${ifiscal}`);
      }
    }).addTo(map);
  
    camadaHighlight.once("load", () => {
      camadaHighlight.query().where(`gtm_ind_fiscal = '${ifiscal}'`).bounds((err, bounds) => {
        if (!err && bounds) map.fitBounds(bounds);
      });
    });
  
    // Centraliza marcador
    if (atributos.x_coord && atributos.y_coord) {
      const [lat, lon] = utmToLatLon(parseFloat(atributos.x_coord), parseFloat(atributos.y_coord));
      if (marcador) marcador.remove();
      marcador = L.marker([lat, lon]).addTo(map).bindPopup("Lote centralizado").openPopup();
    }
  }
  
  // Converte UTM para Latitude/Longitude
  function utmToLatLon(x, y, zone = 22, south = true) {
    const a = 6378137.0;
    const e = 0.081819191;
    const k0 = 0.9996;
    x -= 500000;
    if (south) y -= 10000000;
    const m = y / k0;
    const mu = m / (a * (1 - e ** 2 / 4 - 3 * e ** 4 / 64 - 5 * e ** 6 / 256));
    const e1 = (1 - Math.sqrt(1 - e ** 2)) / (1 + Math.sqrt(1 - e ** 2));
    const j1 = 3 * e1 / 2 - 27 * e1 ** 3 / 32;
    const j2 = 21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32;
    const j3 = 151 * e1 ** 3 / 96;
    const j4 = 1097 * e1 ** 4 / 512;
    const fp = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu);
    const c1 = (e ** 2 / (1 - e ** 2)) * Math.cos(fp) ** 2;
    const t1 = Math.tan(fp) ** 2;
    const r1 = a * (1 - e ** 2) / Math.pow(1 - e ** 2 * Math.sin(fp) ** 2, 1.5);
    const n1 = a / Math.sqrt(1 - e ** 2 * Math.sin(fp) ** 2);
    const d = x / (n1 * k0);
    const lat = fp - (n1 * Math.tan(fp) / r1) * (d ** 2 / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * e ** 2 / (1 - e ** 2)) * d ** 4 / 24);
    const lon = (d - (1 + 2 * t1 + c1) * d ** 3 / 6) / Math.cos(fp);
    return [lat * 180 / Math.PI, lon * 180 / Math.PI + (zone * 6 - 183)];
  }
  
  // Gera HTML da Tabela
  function gerarTabela(dados) {
    let html = `<table class="table table-sm table-bordered" id="A"><tbody>`;
    for (const [campo, valor] of dados) {
      html += `<tr><th>${campo}</th><td>${valor != null ? valor : ""}</td></tr>`;
    }
    return html + "</tbody></table>";
  }
  
  // Formata número com vírgula
  function format(num) {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + " m²";
  }
  