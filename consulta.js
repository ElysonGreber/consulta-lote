const zoneamentoData = {
    "EAC": [1.0, 0.50, 0.25, 2, "5 m", "450 m²", "15 m"],
    "ZR1": [1.5, 0.50, 0.30, 3, "5 m", "360 m²", "12 m"],
    "ZR2": [1.0, 0.50, 0.30, 2, "5 m", "360 m²", "12 m"],
    "ZR3": [1.0, 0.50, 0.30, 2, "5 m", "360 m²", "12 m"],
    "ZR3-T": [1.0, 0.50, 0.25, 4, "5 m", "360 m²", "12 m"],
    "ZR4": [1.0, 0.50, 0.30, 2, "5 m", "360 m²", "12 m"],
    "ZR5": [1.0, 0.50, 0.30, 2, "5 m", "360 m²", "12 m"],
    "ZUM": [2.0, 0.70, 0.20, 6, "5 m", "300 m²", "12 m"],
    "ZC": [3.0, 0.80, 0.15, 8, "5 m", "300 m²", "12 m"],
    "ZPI": [2.5, 0.60, 0.25, 6, "10 m", "1000 m²", "20 m"],
    "ZOE": [1.0, 0.50, 0.30, 3, "5 m", "500 m²", "15 m"],
    "ZPDS": [0.5, 0.20, 0.50, 2, "10 m", "2000 m²", "30 m"]
};

const map = L.map('map', {
    zoomControl: false,
    maxZoom: 30,
    minZoom: 0
}).setView([-25.4284, -49.2733], 15);

L.esri.tiledMapLayer({
    url: "https://geocuritiba.ippuc.org.br/server/rest/services/Hosted/Ortofotos2019/MapServer",
    maxZoom: 30
}).addTo(map);
L.esri.dynamicMapLayer({
    url: "https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer",
    layers: [23, 15, 34],
    opacity: 0.8
}).addTo(map);
const layer11 = L.esri.dynamicMapLayer({
    url: "https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer",
    layers: [11], // Certifique-se de que o layer 11 contém os rótulos
    opacity: 1.0 // Ajuste a opacidade para garantir visibilidade
}).addTo(map);

// Força o layer 11 a sobrepor os demais
layer11.bringToFront();
let grafico = null;
// Capitaliza os Caracteres da Via
function capitalizeWords(str) {
    return str.normalize("NFD") // separa letras e acentos
        .toLowerCase()
        .replace(/(?:^|\s|-)\S/g, c => c.toUpperCase()) // maiúscula após espaço ou hífen
        .normalize("NFC"); // recompõe os acentos
}

function gerarTextoBasico(atributos, cep = '') {

    const indicacao = atributos.gtm_ind_fiscal || '';
    const inscricao = atributos.gtm_insc_imob || '';
    const logradouro = capitalizeWords(atributos.gtm_nm_logradouro || '');
    const numero = atributos.gtm_num_predial || '';
    const bairro = capitalizeWords(atributos.gtm_nm_bairro || '');

    return `
<div class="ordercalc" style="font-size: 15px;display: flex;align-items: center;justify-content: space-around;flex-wrap: wrap;align-content: center;justify-items: stretch;"">
    <div style="
    display: block;
">
    <strong>Indicação Fiscal:</strong> ${indicacao}&nbsp;
    </div>
    <div style="
    display: block;
">
    <strong>Inscrição Imobiliária:</strong> ${inscricao}&nbsp;
    </div>
    <div style="
    display: block;
">
    <strong>Logradouro:</strong> ${logradouro}&nbsp;
    </div>
    <div style="
    display: block;
">
    <strong>Número:</strong> ${numero}&nbsp;
    </div>
    <div style="
    display: block;
">
    <strong>Bairro:</strong> ${bairro}&nbsp;
    </div>
    <div style="
    display: block;
">
    <strong>CEP:</strong> ${cep} &nbsp;
    </div>
</div>
`;
}
// Desenha imagem Isometrica
function desenharIsometrico(geometry) {
    const canvas = document.getElementById('iso-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!geometry || !geometry.coordinates) {
        ctx.fillText("Sem geometria para desenhar", 10, 50);
        return;
    }

    const coords = geometry.coordinates[0];
    let xs = coords.map(p => p[0]),
        ys = coords.map(p => p[1]);
    let minX = Math.min(...xs),
        maxX = Math.max(...xs);
    let minY = Math.min(...ys),
        maxY = Math.max(...ys);
    const padding = 20;
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    function isoProj(x, y) {
        return [(x - y) * Math.cos(Math.PI / 6), (x + y) * Math.sin(Math.PI / 6)];
    }

    const projected = coords.map(([x, y]) => {
        const nx = (x - minX) * scale;
        const ny = (y - minY) * scale;
        return isoProj(nx, ny);
    });

    const projXs = projected.map(p => p[0]),
        projYs = projected.map(p => p[1]);
    const offsetX = (canvas.width - (Math.max(...projXs) - Math.min(...projXs))) / 2 - Math.min(...projXs);
    const offsetY = (canvas.height - (Math.max(...projYs) - Math.min(...projYs))) / 2 - Math.min(...projYs);

    ctx.beginPath();
    projected.forEach(([x, y], i) => {
        const px = x + offsetX;
        const py = canvas.height - (y + offsetY);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(100, 150, 240, 0)';
    ctx.fill();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
}
// Desenha  Imagem Topo //
function desenharTopo(geometry) {
    const canvas = document.getElementById('top-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!geometry || !geometry.coordinates) {
        ctx.fillText("Sem geometria para desenhar", 10, 50);
        return;
    }

    const coords = geometry.coordinates[0];
    let xs = coords.map(p => p[0]),
        ys = coords.map(p => p[1]);
    let minX = Math.min(...xs),
        maxX = Math.max(...xs);
    let minY = Math.min(...ys),
        maxY = Math.max(...ys);
    const scaleX = (canvas.width - 40) / (maxX - minX);
    const scaleY = (canvas.height - 40) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    // Projeta coordenadas
    const projected = coords.map(([x, y]) => {
        const nx = (x - minX) * scale;
        const ny = (y - minY) * scale;
        return [nx, ny];
    });
    // Calcula deslocamento para centralizar
    const projXs = projected.map(p => p[0]);
    const projYs = projected.map(p => p[1]);
    const widthProj = Math.max(...projXs) - Math.min(...projXs);
    const heightProj = Math.max(...projYs) - Math.min(...projYs);
    const offsetX = (canvas.width - widthProj) / 2 - Math.min(...projXs);
    const offsetY = (canvas.height - heightProj) / 2 - Math.min(...projYs);

    // Aplica deslocamento
    const final = projected.map(([x, y]) => [
        x + offsetX,
        canvas.height - (y + offsetY)
    ]);

    // Desenha o polígono
    ctx.beginPath();
    final.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 200, 100, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Configura texto
    ctx.fillStyle = 'black';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Calcula distâncias reais e desenha nos centros das arestas
    function distanciaHaversine(coord1, coord2) {
        const toRad = (deg) => deg * Math.PI / 180;
        const R = 6371000;
        const lat1 = coord1[1],
            lon1 = coord1[0];
        const lat2 = coord2[1],
            lon2 = coord2[0];
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    for (let i = 0; i < final.length; i++) {
        const [x1, y1] = final[i];
        const [x2, y2] = final[(i + 1) % final.length];
        const centroX = (x1 + x2) / 2;
        const centroY = (y1 + y2) / 2;
        const originalP1 = coords[i];
        const originalP2 = coords[(i + 1) % coords.length];
        const dist = distanciaHaversine(originalP1, originalP2);
        ctx.fillText(dist.toFixed(2) + " m", centroX, centroY);
    }
}
// ************* Função Principal 
async function buscarLote(event) {
    event.preventDefault();
    const ifiscal = document.getElementById('inputIndicacaoFiscal').value.trim();
    if (!ifiscal) return;

    document.getElementById('mensagem').innerHTML = '';
    document.getElementById('html_basico').innerHTML = '';
    document.getElementById('html_calcs').innerHTML = '';
    document.getElementById("html_lote").innerHTML = "";
    document.getElementById("html_extra").innerHTML = "";
    const el = document.getElementById('html_valores');
    if (el) el.remove();
    desenharIsometrico(null);
    desenharTopo(null);

    const url15 = `https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/15/query?where=gtm_ind_fiscal='${ifiscal}'&outFields=*&f=json`;
    const dadosLote = await fetch(url15).then(r => r.json());
    if (!dadosLote.features || dadosLote.features.length === 0) {
        document.getElementById('mensagem').innerHTML = `<div class="alert alert-warning mt-3">Nenhum lote encontrado.</div>`;
        return;
    }

    const atributos = dadosLote.features[0].attributes;
    const cep = await obterCepPorIndicacaoFiscal(ifiscal);
    document.getElementById('html_basico').innerHTML = gerarTextoBasico(atributos, cep);


    const zona = atributos.gtm_sigla_zoneamento ? atributos.gtm_sigla_zoneamento.trim() : null;
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
        html2 = `
        <div class="ordercalc">
        <h5 class="titulotabextra">Cálculo de Potencial Construtivo</h5>
            ${gerarTabelaextra(calc)}
        </div>
    `;
        document.getElementById("html_calcs").innerHTML = html2
        mostrarQuadroZoneamento(zona);
    }
    // `;
    // }
    const dadosLoteArr = Object.entries(atributos);
    html3 = `
        <div class="ordercalc">
        <h5 class="titulotabextra">Atributos do Lote</h5>
            ${gerarTabelaextra(dadosLoteArr)}
        </div>
    `;
    document.getElementById("html_lote").innerHTML = html3;

    const url20 = `https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/20/query?where=gtm_ind_fiscal='${ifiscal}'&outFields=*&f=json`;
    const dadosExtra = await fetch(url20).then(r => r.json());

    if (dadosExtra.features && dadosExtra.features.length > 0) {
        let html = "";
        dadosExtra.features.forEach((f, i) => {
            const attrs = f.attributes;
            const camposDesejados = [
                ["Número Técnica", attrs.gtm_num_tecnica],
                ["Tipo Testada", attrs.gtm_tipo_testada],
                ["Descrição Testada", attrs.gtm_desc_tipo_testada],
                ["Comprimento (m)", attrs["st_length(shape)"] != null ? attrs["st_length(shape)"].toFixed(2) + " m" : ""]
            ];

            html += `
                <div class="ordercalc">
                    <h5 class="titulotabextra">Testada ${String(i + 1).padStart(2, '0')}</h5>
                    ${gerarTabelaextra(camposDesejados)}
                </div>
            `;
        });
        document.getElementById("html_extra").innerHTML = html;
    }
    if (window.camadaHighlight) window.camadaHighlight.remove();
    window.camadaHighlight = L.esri.featureLayer({
        url: "https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/16",
        where: `gtm_ind_fiscal = '${ifiscal}'`,
        style: {
            color: "red",
            weight: 3,
            fillOpacity: 0.1
        },
        onEachFeature: (feature, layer) => layer.bindPopup(`Indicação Fiscal: ${ifiscal}`)
    }).addTo(map);
    window.camadaHighlight.once('load', () => {
        window.camadaHighlight.query().where(`gtm_ind_fiscal = '${ifiscal}'`).bounds((err, bounds) => {
            if (!err && bounds) map.fitBounds(bounds, 12);
            window.camadaHighlight.once('load', () => {
                window.camadaHighlight.query().where(`gtm_ind_fiscal = '${ifiscal}'`).bounds((err, bounds) => {
                    if (!err && bounds) {
                        map.fitBounds(bounds, 12);

                        // Captura o bounding box em coordenadas geográficas (EPSG:4326)
                        const sw = bounds.getSouthWest();
                        const ne = bounds.getNorthEast();

                        // Expande a BBOX em 10% para cada lado
                        const expandRatio = 0.5;
                        const latDiff = ne.lat - sw.lat;
                        const lngDiff = ne.lng - sw.lng;

                        const expandedSw = L.latLng(sw.lat - latDiff * expandRatio, sw.lng - lngDiff * expandRatio);
                        const expandedNe = L.latLng(ne.lat + latDiff * expandRatio, ne.lng + lngDiff * expandRatio);

                        const bbox = `${expandedSw.lng},${expandedSw.lat},${expandedNe.lng},${expandedNe.lat}`;

                        // Constrói a URL da imagem da camada 38 (Interno_imagem_confrontantes)
                        const exportUrl = `https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Interno_imagem_confrontantes/MapServer/export` +
                            `?f=image&bboxSR=4326&imageSR=4326&format=png&transparent=false&size=800,800` +
                            `&bbox=${bbox}&dpi=96`;


                        // Exibe a imagem dentro da div fixa
                        const imgHTML = `
                                        <div>
                                             <div class="card-header p-2 bg-secondary text-white">Imagem Confrontante</div>
                                                <div class="card-body p-2 text-center">
                                                 <img src="${exportUrl}" class="imgconf" alt="Imagem confrontante do lote">
                                                </div>
                                        </div>`;
                        document.getElementById("imagem_confrontante").innerHTML = imgHTML;
                    }
                });
            });
        });
    });

    const url16 = `https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/16/query?where=gtm_ind_fiscal='${ifiscal}'&outFields=*&returnGeometry=true&f=geojson`;
    const geojson = await fetch(url16).then(r => r.json());
    const geometry = (geojson.features && geojson.features.length > 0) ? geojson.features[0].geometry : null;

    if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
        const coords = geometry.coordinates[0][0]; // pega o primeiro ponto do polígono
        const [lng, lat] = coords; // formato GeoJSON: [longitude, latitude]
        gerarBotaoStreetViewCoordenadas(lat, lng);
    }
    desenharIsometrico(geometry);
    desenharTopo(geometry);


    try {
        const resposta = await fetch("https://geocuritiba.ippuc.org.br/GeoCuritibaPHP/PlantaGenericaDeValores/LotesObtemValores.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                indfiscal: ifiscal
            })
        });
        const texto = await resposta.text();
        const linhas = texto.trim().split("|").filter(l => l);

        const anosTodos = [];
        for (let ano = 2025; ano >= 2002; ano--) anosTodos.push(ano.toString());

        const anosDesejados = [];
        for (let ano = 2015; ano <= 2025; ano++) anosDesejados.push(ano.toString());

        let htmlValores = '<div id="html_valores" class="ordercalc">';
        htmlValores += '<h5 class="titulotabextra">Valores por m² (Localidade)</h5>';
        htmlValores += '<table class="ptable"><thead><tr><th>Ano</th><th>Valor (R$/m²)</th></tr></thead><tbody>';

        if (linhas.length > 0) {
            const valores = linhas[0].split(";").filter(v => v);
            const valoresReais = anosTodos.map((ano, i) => ({
                ano,
                valor: parseFloat((valores[anosTodos.length - 1 - i] || "0").replace(",", "."))
            }));

            // Filtra apenas os anos desejados com valor > 0 e ordena
            const filtrados = valoresReais
                .filter(v => anosDesejados.includes(v.ano) && v.valor !== 0)
                .sort((a, b) => a.ano.localeCompare(b.ano));

            // Para o gráfico: anos em ordem crescente
            const anosGrafico = filtrados.map(v => v.ano);
            const valoresGrafico = filtrados.map(v => v.valor);
            atualizarGrafico(anosGrafico, valoresGrafico);

            // Para a tabela: anos em ordem decrescente
            const tabelaDecrescente = [...filtrados].sort((a, b) => parseInt(b.ano) - parseInt(a.ano));
            for (let i = 0; i < tabelaDecrescente.length; i++) {
                htmlValores += `<tr><td>${tabelaDecrescente[i].ano}</td><td>R$ ${tabelaDecrescente[i].valor.toFixed(2)}</td></tr>`;
            }

        } else {
            htmlValores += '<tr><td colspan="2">Sem valores encontrados.</td></tr>';
            atualizarGrafico([], []);
        }

        htmlValores += '</tbody></table></div>';
        document.getElementById("html_calc").insertAdjacentHTML("afterend", htmlValores);
    } catch (erro) {
        document.getElementById("html_calc").insertAdjacentHTML("afterend", `
            <div id="html_valores" class="mt-4 alert alert-warning">Erro ao obter valores por m².</div>
        `);
        atualizarGrafico([], []);
    }
}

function atualizarGrafico(anos, valores) {
    const ctx = document.getElementById('grafico-valores').getContext('2d');
    if (grafico) {
        grafico.destroy();
    }
    grafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: 'Valor R$/m²',
                data: valores,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    },
                    title: {
                        display: true,
                        text: 'Valor (R$/m²)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Ano'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

document.getElementById('formConsulta').addEventListener('submit', buscarLote);
let camada15 = null;

function atualizarCamada15() {
    const zoomAtual = map.getZoom();

    if (zoomAtual > 18) {
        if (!camada15) {
            camada15 = L.esri.featureLayer({
                url: "https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/15",
                outFields: ['gtm_ind_fiscal'],
                style: {
                    color: "#FF9900",
                    weight: 1,
                    fillOpacity: 0
                },
                onEachFeature: function(feature, layer) {
                    const indfisc = feature.properties.gtm_ind_fiscal || "Sem informação";
                    layer.bindPopup(`<strong>Indicação Fiscal:</strong> ${indfisc}`);
                }
            }).addTo(map);
        }
    } else {
        if (camada15) {
            map.removeLayer(camada15);
            camada15 = null;
        }
    }
}

// Atualiza quando o zoom muda
map.on('zoomend', atualizarCamada15);

// Verifica ao carregar a página
atualizarCamada15();

function format(num) {
    return num.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) + " m²";
}

function gerarTabela(dados) {
    let html = `<div class="ordercalc"><table class="ptable" id="A"><tbody>`;
    for (const [campo, valor] of dados) {
        html += `<tr><th>${campo}</th><td>${valor != null ? valor : ""}</td></tr>`;
    }
    return html + "</tbody></table></div>";
}

function gerarTabelaextra(dados) {
    let html = `<table class="ptable" id="A"><tbody>`;
    for (const [campo, valor] of dados) {
        html += `<tr><th>${campo}</th><td>${valor != null ? valor : ""}</td></tr>`;
    }
    return html + "</tbody></table>";
}
async function obterCepPorIndicacaoFiscal(ifiscal) {
    const url15 = `https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/15/query?where=gtm_ind_fiscal='${ifiscal}'&outFields=gtm_cod_logradouro&f=json`;
    const dados = await fetch(url15).then(r => r.json());

    if (!dados.features || dados.features.length === 0) return '';

    const codLogradouro = dados.features[0].attributes.gtm_cod_logradouro;
    if (!codLogradouro) return '';

    const url11 = `https://geocuritiba.ippuc.org.br/server/rest/services/GeoCuritiba/Publico_GeoCuritiba_MapaCadastral/MapServer/11/query?where=gtm_cod_logradouro='${codLogradouro}'&outFields=cep_e&f=json`;
    const dadosCep = await fetch(url11).then(r => r.json());

    if (dadosCep.features && dadosCep.features.length > 0) {
        return dadosCep.features[0].attributes.cep_e || '';
    }

    return '';
}

function gerarBotaoStreetViewCoordenadas(lat, lng) {
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
    const botao = `
        <div class ="ordercalc" style="
        display: flex;
        align-content: center;
        align-items: center;
        justify-content: center;
    ">
             <a href="${url}" target="_blank" 
             title="Ver no Google Street View" 
             style=" display: flex; align-content: center; align-items: center;">
                <img src="maps.ico" alt="Street View" style="width:32px; height:32px; cursor:pointer;">
                <span style="font-size: 17px;font-weight: bold;font-family: &quot;Baumans&quot;, system-ui;color: #4695e0;">Ver no Google Street View</span>
            </a>
        </div>`;
    document.getElementById("botao_streetview").innerHTML = botao;
}

// function mostrarQuadroZoneamento(zona) {
//     const htmlZonaZR1 = `
//         <div class="ordercalc">
//             <h5 class="titulotabextra">Quadro XVI - Zona Residencial 1 (ZR1)</h5>
//             <table class="ptable" id="tabela-zr1">
//                 <thead>
//                     <tr>
//                         <th>Usos</th>
//                         <th>Coef. de Aproveitamento</th>
//                         <th>Altura (pav.)</th>
//                         <th>Porte (m²)</th>
//                         <th>Taxa de Ocupação</th>
//                         <th>Recuo</th>
//                         <th>Taxa de Permeabilidade</th>
//                         <th>Afast. das Divisas</th>
//                         <th>Lote Padrão</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     <tr><th colspan="9" style="text-align:left;">USOS HABITACIONAIS</th></tr>
//                     <tr>
//                         <td>Habitações Unifamiliares (1)</td>
//                         <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>-</td><td>15 x 600</td>
//                     </tr>
//                     <tr>
//                         <td>Habitação Unifamiliar em Série (3)</td>
//                         <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>-</td><td></td>
//                     </tr>
//                     <tr><th colspan="9" style="text-align:left;">USOS NÃO HABITACIONAIS</th></tr>
//                     <tr>
//                         <td>Comércio e Serviço Vicinal (4)</td>
//                         <td>-</td><td>-</td><td>100</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
//                     </tr>
//                     <tr>
//                         <td>Indústria Tipo 1 (5)</td>
//                         <td>-</td><td>-</td><td>100</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
//                     </tr>
//                 </tbody>
//             </table>
//             <small>
//                 <ul style="font-size: 13px;padding: 10px 10px 0 10px;">
//                     <li>(1) Uma habitação unifamiliar por fração de 300 m²</li>
//                     <li>(2) Atender regulamentação específica</li>
//                     <li>(3) Somente em terrenos menores que 20.000 m², com fração mínima de 300 m² por unidade</li>
//                     <li>(4) Somente em edificação existente</li>
//                     <li>(5) Somente em edificação existente e vinculada ao uso habitacional</li>
//                 </ul>
//             </small>
//         </div>
//     `;

//     if (zona === "ZR1") {
//         const divZona = document.getElementById("html_zona");
//         if (divZona) divZona.remove();
//         const div = document.createElement("div");
//         div.id = "html_zona";
//         div.innerHTML = htmlZonaZR1;
//         document.getElementById("html_calcs").insertAdjacentElement("afterend", div);
//     }
//     if (zona === "ZR2") {
//         const zonaDiv = document.getElementById("html_zona");
//         if (zonaDiv) zonaDiv.remove();

//         const div = document.createElement("div");
//         div.id = "html_zona";
//         div.innerHTML = `
//             <div class="ordercalc">
//                 <h5 class="titulotabextra">Quadro XVII - Zona Residencial 2 (ZR2)</h5>
//                 <table class="ptable" id="tabela-zr2">
//                     <thead>
//                         <tr>
//                             <th>Usos</th>
//                             <th style="width: 20%;">Coef. de Aproveitamento</th>
//                             <th>Altura (pav.)</th>
//                             <th>Porte (m²)</th>
//                             <th>Taxa de Ocupação</th>
//                             <th>Recuo</th>
//                             <th>Taxa de Permeabilidade</th>
//                             <th>Afast. das Divisas</th>
//                             <th>Lote Padrão</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         <tr><th colspan="9" style="text-align:left;">Usos Habitacionais</th></tr>
//                         <tr>
//                             <td>Habitação Unifamiliar (1)</td>
//                             <td>1</td><td>2</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>-</td><td>12 x 360</td>
//                         </tr>
//                         <tr>
//                             <td>Habitação Unifamiliar em Série (1)(4)</td>
//                             <td>1</td><td>2</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
//                         </tr>
//                         <tr>
//                             <td>Habitação Institucional</td>
//                             <td>1</td><td>2</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
//                         </tr>
//                         <tr>
//                             <td>Empreendimento Inclusivo de HIS (3)</td>
//                             <td>1</td><td>2</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
//                         </tr>
//                         <tr><th colspan="9" style="text-align:left;">Usos Não Habitacionais</th></tr>
//                         <tr>
//                             <td>Comunitário 1 (5)</td>
//                             <td>1 (6)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
//                         </tr>
//                         <tr>
//                             <td>Comércio e Serviço Vicinal e de Bairro (5)</td>
//                             <td>1 (6)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
//                         </tr>
//                         <tr>
//                             <td>Comunitário 2 – Culto Religioso</td>
//                             <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
//                         </tr>
//                         <tr>
//                             <td>Indústria Tipo 1 (7)</td>
//                             <td>-</td><td>-</td><td>200</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
//                         </tr>
//                     </tbody>
//                 </table>
//                 <small>
//                     <ul style="font-size: 13px;padding: 10px 10px 0 10px;">
//                         <li>(1) Fração mínima de 120 m² por unidade habitacional.</li>
//                         <li>(2) Em lotes menores que o padrão, pode chegar até 60% proporcionalmente (uma única unidade).</li>
//                         <li>(3) Atender regulamentação específica.</li>
//                         <li>(4) Apenas em lotes < 20.000 m².</li>
//                         <li>(5) Alvará possível até 400 m² com aprovação do CMU.</li>
//                         <li>(6) Desde que limitado a 200 m².</li>
//                         <li>(7) Somente em edificação existente.</li>
//                         <li style="font-weight: bold;">Fonte: Lei nº 15.511_2019 Atualizada 19.11.2019.</li>
//                     </ul>
//                 </small>
//             </div>
//         `;
//         document.getElementById("html_calcs").insertAdjacentElement("afterend", div);
//     }

// }
function mostrarQuadroZoneamento(zona) {
    const anterior = document.getElementById("html_zona");
    if (anterior) anterior.remove();

    let html = "";

    if (zona === "ZR1") {
        html = `<div id="html_zona" class="ordercalc">
                    <h5 class="titulotabextra">Quadro XVI - Zona Residencial 1 (ZR1)</h5>
                    <table class="ptable" id="tabela-zr1">
                        <thead>
                            <tr>
                                <th>Usos</th>
                                <th>Coef. de Aproveitamento</th>
                                <th>Altura (pav.)</th>
                                <th>Porte (m²)</th>
                                <th>Taxa de Ocupação</th>
                                <th style="width: fit-content;">Recuo</th>                                <th>Taxa de Permeabilidade</th>
                                <th>Afast. das Divisas</th>
                                <th>Lote Padrão</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><th colspan="9" style="text-align:left;">USOS HABITACIONAIS</th></tr>
                            <tr>
                                <td>Habitações Unifamiliares (1)</td>
                                <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>-</td><td>15 x 600</td>
                            </tr>
                            <tr>
                                <td>Habitação Unifamiliar em Série (3)</td>
                                <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>-</td><td></td>
                            </tr>
                            <tr><th colspan="9" style="text-align:left;">USOS NÃO HABITACIONAIS</th></tr>
                            <tr>
                                <td>Comércio e Serviço Vicinal (4)</td>
                                <td>-</td><td>-</td><td>100</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                            </tr>
                            <tr>
                                <td>Indústria Tipo 1 (5)</td>
                                <td>-</td><td>-</td><td>100</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                            </tr>
                        </tbody>
                    </table>
                    <small>
                        <ul style="font-size: 13px;padding: 10px 10px 0 10px;">
                            <li>(1) Uma habitação unifamiliar por fração de 300 m²</li>
                            <li>(2) Atender regulamentação específica</li>
                            <li>(3) Somente em terrenos menores que 20.000 m², com fração mínima de 300 m² por unidade</li>
                            <li>(4) Somente em edificação existente</li>
                            <li>(5) Somente em edificação existente e vinculada ao uso habitacional</li>
                        </ul>
                    </small>
                </div>`;
    } else if (zona === "ZR2") {
        html = `<div id="html_zona" class="ordercalc">
                        <h5 class="titulotabextra">Quadro XVII - Zona Residencial 2 (ZR2)</h5>
                        <table class="ptable" id="tabela-zr2">
                            <thead>
                                <tr>
                                    <th>Usos</th>
                                    <th style="width: 20%;">Coef. de Aproveitamento</th>
                                    <th>Altura (pav.)</th>
                                    <th>Porte (m²)</th>
                                    <th>Taxa de Ocupação</th>
                                    <th style="width: fit-content;">Recuo</th>                                    <th>Taxa de Permeabilidade</th>
                                    <th>Afast. das Divisas</th>
                                    <th>Lote Padrão</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><th colspan="9" style="text-align:left;">Usos Habitacionais</th></tr>
                                <tr>
                                    <td>Habitação Unifamiliar (1)</td>
                                    <td>1</td><td>2</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>-</td><td>12 x 360</td>
                                </tr>
                                <tr>
                                    <td>Habitação Unifamiliar em Série (1)(4)</td>
                                    <td>1</td><td>2</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                                </tr>
                                <tr>
                                    <td>Habitação Institucional</td>
                                    <td>1</td><td>2</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                                </tr>
                                <tr>
                                    <td>Empreendimento Inclusivo de HIS (3)</td>
                                    <td>1</td><td>2</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                                </tr>
                                <tr><th colspan="9" style="text-align:left;">Usos Não Habitacionais</th></tr>
                                <tr>
                                    <td>Comunitário 1 (5)</td>
                                    <td>1 (6)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                                </tr>
                                <tr>
                                    <td>Comércio e Serviço Vicinal e de Bairro (5)</td>
                                    <td>1 (6)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                                </tr>
                                <tr>
                                    <td>Comunitário 2 – Culto Religioso</td>
                                    <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                                </tr>
                                <tr>
                                    <td>Indústria Tipo 1 (7)</td>
                                    <td>-</td><td>-</td><td>200</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                                </tr>
                            </tbody>
                        </table>
                        <small>
                            <ul style="font-size: 13px;padding: 10px 10px 0 10px;">
                                <li>(1) Fração mínima de 120 m² por unidade habitacional.</li>
                                <li>(2) Em lotes menores que o padrão, pode chegar até 60% proporcionalmente (uma única unidade).</li>
                                <li>(3) Atender regulamentação específica.</li>
                                <li>(4) Apenas em lotes < 20.000 m².</li>
                                <li>(5) Alvará possível até 400 m² com aprovação do CMU.</li>
                                <li>(6) Desde que limitado a 200 m².</li>
                                <li>(7) Somente em edificação existente.</li>
                                <li style="font-weight: bold;">Fonte: Lei nº 15.511_2019 Atualizada 19.11.2019.</li>
                            </ul>
                        </small>
                    </div>`;

    } else if (zona === "ZR3") {
        html = `<div id="html_zona" class="ordercalc">
        <h5 class="titulotabextra">Quadro XVIII - Zona Residencial 3 (ZR3)</h5>
        <table class="ptable" id="tabela-zr3">
            <thead>
                <tr>
                    <th>Usos</th>
                    <th>Coef. de Aproveitamento</th>
                    <th>Altura (pav.)</th>
                    <th>Porte (m²)</th>
                    <th>Taxa de Ocupação</th>
                    <th style="width: fit-content;">Recuo</th>                    <th>Taxa de Permeabilidade</th>
                    <th>Afast. das Divisas</th>
                    <th>Lote Padrão</th>
                </tr>
            </thead>
            <tbody>
            <tr><th colspan="9" style="text-align:left;">Usos Habitacionais</th></tr>
                <tr>
                    <td>Habitação Unifamiliar (1)(2)</td>
                    <td>1</td><td>3 (4)</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>(5)</td><td>12 x 360</td>
                </tr>
                <tr>
                    <td>Habitação Unifamiliar em Série (1)(6)</td>
                    <td>1</td><td>3 (4)</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>(5)</td><td></td>
                </tr>
                <tr>
                    <td>Habitação Coletiva (6)</td>
                    <td>1</td><td>3 (4)</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>(5)</td><td></td>
                </tr>
                <tr>
                    <td>Habitação Institucional</td>
                    <td>1</td><td>3 (4)</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>(5)</td><td></td>
                </tr>
                <tr>
                    <td>Habitação Transitória 1 (7)</td>
                    <td>1</td><td>3 (4)</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>(5)</td><td></td>
                </tr>
                <tr>
                    <td>Empreendimento Inclusivo de HIS (3)</td>
                    <td>1</td><td>3 (4)</td><td>-</td><td>50% (2)</td><td>5 m</td><td>25% (3)</td><td>(5)</td><td></td>
                </tr>
                <tr><th colspan="9" style="text-align:left;">Usos Não Habitacionais</th></tr>
                <tr>
                    <td>Comunitário 1 (8)</td>
                    <td>1 (9)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Comunitário 2 – Saúde</td>
                    <td>1 (9)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Comércio e Serviço Vicinal e de Bairro (8)</td>
                    <td>1 (9)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Comunitário 2 – Culto Religioso</td>
                    <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Indústria Tipo 1 (10)</td>
                    <td>-</td><td>-</td><td>200</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                </tr>
            </tbody>
        </table>
        <small>
            <ul style="font-size: 13px;">
                <li>(1) Fração mínima de 120 m² por unidade habitacional.</li>
                <li>(2) Em lotes menores que o padrão, pode chegar até 60% proporcionalmente (uma única unidade).</li>
                <li>(3) Atender regulamentação específica.</li>
                <li>(4) Até 3 pavimentos com até 10 m de altura; afastamento facultado.</li>
                <li>(5) Afastamento mínimo de 2,50 m para habitação institucional.</li>
                <li>(6) Somente em terrenos &lt; 20.000 m².</li>
                <li>(7) Apenas Apart-hotel; pode ter usos comerciais de bairro.</li>
                <li>(8) Alvará até 400 m² com aprovação do CMU.</li>
                <li>(9) Limitado a 200 m².</li>
                <li>(10) Somente em edificação existente.</li>
                <li style="font-weight: bold;">Fonte: Lei nº 15.511_2019 Atualizada 19.11.2019.</li>
            </ul>
        </small>
    </div>`;
    } else if (zona === "ZR3-T") {
        html = `<div id="html_zona" class="ordercalc">
        <h5 class="titulotabextra">Quadro XIX - Zona Residencial 3 Transição (ZR3-T)</h5>
        <table class="ptable" id="tabela-zr3t">
            <thead>
                <tr>
                    <th>Usos</th>
                    <th>Coef. de Aproveitamento</th>
                    <th>Altura (pav.)</th>
                    <th>Porte (m²)</th>
                    <th>Taxa de Ocupação</th>
                    <th style="width: fit-content;">Recuo</th>                    <th>Taxa de Permeabilidade</th>
                    <th>Afast. das Divisas</th>
                    <th>Lote Padrão</th>
                </tr>
            </thead>
            <tbody>
            <tr><th colspan="9" style="text-align:left;">Usos Habitacionais</th></tr>
                <tr>
                    <td>Habitações Unifamiliares (1)</td>
                    <td></td><td></td><td></td><td></td><td></td><td></td>
                    <td>Até 2 pav. = Facultado. Acima de 2 pav. = H/6, contado a partir do Térreo, atendido o mínimo de 2,50 m.</td>
                    <td>15 x 450</td>
                </tr>
                <tr>
                    <td>Habitação Coletiva</td>
                    <td>1</td><td>4 (2)</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td></td><td></td>
                </tr>
                <tr>
                    <td>Habitação Institucional</td>
                    <td>1</td><td>4 (2)</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td></td><td></td>
                </tr>
                <tr>
                    <td>Habitação Transitória 1</td>
                    <td>1</td><td>4 (2)</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td></td><td></td>
                </tr>
                <tr><th colspan="9" style="text-align:left;">Usos Não Habitacionais</th></tr>
                <tr>
                    <td>Comunitário 1 (6)</td>
                    <td>1 (5)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Edifício de Escritórios e Sede Administrativa</td>
                    <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Comércio e Serviço Vicinal e de Bairro (6)</td>
                    <td>1 (5)</td><td>2</td><td>200</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Comunitário 2 – Culto Religioso e Saúde</td>
                    <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Comunitário 2 – Ensino</td>
                    <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (3)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Indústria Tipo 1 (7)</td>
                    <td>-</td><td>-</td><td>200</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                </tr>
            </tbody>
        </table>
        <small>
        <ul style="font-size: 13px;padding: 10px 10px 0 10px;">
                <li>(1) Admitido até 3 habitações unifamiliares por lote.</li>
                <li>(2) Em testadas para vias externas do Eixo Estrutural ou Eixo Nova Curitiba, até 100 m de profundidade, admite-se até 6 pavimentos.</li>
                <li>(3) Atender regulamentação específica.</li>
                <li>(4) Para usos não habitacionais com testada para via externa, devem ser seguidas as condições do Art. 42 (Eixo Nova Curitiba).</li>
                <li>(5) Aplicar o parâmetro mais restritivo entre coeficiente e porte.</li>
                <li>(6) Alvará possível até 400 m² com aprovação do CMU, mesmo em edificações existentes.</li>
                <li>(7) Somente alvará de licença para localização em edificação existente.</li>
                <li style="font-weight: bold;">Fonte: Lei nº 15.511_2019 Atualizada 19.11.2019.</li>
            </ul>
        </small>
    </div>`;
    } else if (zona === "ZR4") {
        html = `<div id="html_zona" class="ordercalc">
        <h5 class="titulotabextra">Parâmetros Urbanísticos - Zona Residencial 4 (ZR4)</h5>
        <table class="ptable">
          <thead>
            <tr>
              <th>Usos</th>
              <th>CA Básico</th>
              <th>Altura (pav.)</th>
              <th>Porte (m²)</th>
              <th>Taxa Ocupação (%)</th>
              <th>Recuo Mín. (m)</th>
              <th>Permeabilidade (%)</th>
              <th>Afastamento das Divisas</th>
              <th>Lote Padrão</th>
            </tr>
          </thead>
          <tbody>
          <tr><th colspan="9" style="text-align:left;">Usos Habitacionais</th></tr>
            <tr><td>Habitações Unifamiliares (1)</td><td>1</td><td>2</td><td>-</td><td>50</td><td>5</td><td>25 (2)</td><td>-</td><td>15x450</td></tr>
            <tr><td>Habitação Unifamiliar em Série (3)</td><td>1</td><td>2</td><td>-</td><td>50</td><td>5</td><td>25 (2)</td><td>-</td><td></td></tr>
            <tr><td>Habitação Coletiva</td><td>2</td><td>6</td><td>-</td><td>50</td><td>5</td><td>25 (2)</td><td>Até 2 pav. = facultado. Acima de 2 pav. = H/6, mínimo 2,50 m</td><td></td></tr>
            <tr><td>Habitação Institucional</td><td>2</td><td>6</td><td>-</td><td>50</td><td>5</td><td>25 (2)</td><td>-</td><td></td></tr>
            <tr><td>Habitação Transitória 1 (4)</td><td>2</td><td>6</td><td>-</td><td>50</td><td>5</td><td>25 (2)</td><td>-</td><td></td></tr>
            <tr><th colspan="9" style="text-align:left;">Usos Não Habitacionais</th></tr>
            <tr><td>Comunitário 1</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td></tr>
            <tr><td>Comunitário 2 - Saúde</td><td>1 (6)</td><td>2</td><td>200 (6)</td><td>50</td><td>5</td><td>25 (2)</td><td>-</td><td></td></tr>
            <tr><td>Comércio e Serviço Vicinal</td><td>1 (6)</td><td>2</td><td>200 (6)</td><td>50</td><td>5</td><td>25 (2)</td><td>-</td><td></td></tr>
            <tr><td>Comunitário 2 - Culto Religioso</td><td>1</td><td>2</td><td>-</td><td>50</td><td>5</td><td>25 (2)</td><td>-</td><td></td></tr>
            <tr><td>Sede Administrativa</td><td>1</td><td>2</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td></tr>
            <tr><td>Indústria Tipo 1</td><td>-</td><td>-</td><td>200</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td></tr>
          </tbody>
          
        </table>
        <small>
          <ul style="font-size: 13px;padding: 10px 10px 0 10px;">
          <li>(1) Deverá ser obedecida a fração de terreno de no mínimo 120 m² por unidade habitacional.</li>
          <li>(2) Atendida regulamentação específica.</li>
          <li>(3) Somente para lotes com área inferior a 20.000 m².</li>
          <li>(4) Sem centro de convenções. São admitidas atividades comerciais e prestação de serviços de bairro no porte da zona em conjunto com a Habitação Transitória 1.</li>
          <li>(5) A critério do CMU poderá ser concedido alvará para Comércio e Serviço Vicinal, Comunitário 1 e 2 - Saúde, em edificação existente e porte de até 400 m².</li>
          <li>(6) Atendido o parâmetro entre coeficiente e porte que for atingido primeiro.</li>
          <li>(7) Somente alvará de licença para localização em edificação existente.</li>
          <li style="font-weight: bold;">Fonte: Lei nº 15.511_2019 Atualizada 19.11.2019.</li>
          </ul>
        </small>
      </div>`;
    }
    if (zona === "ZUM") {
        html = `<div id="html_zona" class="ordercalc">
        <h5 class="titulotabextra">Quadro XXV - Zona de Uso Misto 1 (ZUM-1)</h5>
        <table class="ptable" id="tabela-zum1">
            <thead>
                <tr>
                    <th>Usos</th>
                    <th>Coef. de Aproveitamento</th>
                    <th>Altura (pav.)</th>
                    <th>Porte (m²)</th>
                    <th>Taxa de Ocupação</th>
                    <th style="width: fit-content;">Recuo</th>
                    <th>Taxa de Permeabilidade</th>
                    <th>Afast. das Divisas</th>
                    <th>Lote Padrão</th>
                </tr>
            </thead>
            <tbody>
            <tr><th colspan="9" style="text-align:left;">Usos Habitacionais</th></tr>
                <tr>
                    <td>Habitação Unifamiliar (1)</td>
                    <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>-</td><td>15 x 450</td>
                </tr>
                <tr>
                    <td>Habitação Unifamiliar em série (3)</td>
                    <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Habitação Coletiva (3)</td>
                    <td>1</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>Até 2 pav. = Facultado. Acima de 2 pav. = H/6, atendido o mínimo de 2,50 m.</td><td></td>
                </tr>
                <tr>
                    <td>Habitação Institucional</td>
                    <td>1</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td></td><td></td>
                </tr>
                <tr>
                    <td>Habitação Transitória 1</td>
                    <td>1</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td></td><td></td>
                </tr>
                <tr><th colspan="9" style="text-align:left;">Usos Não Habitacionais</th></tr>
                <tr>
                    <td>Comunitário 1 e 2</td>
                    <td>1</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>Até 2 pav. = Facultado. Acima de 2 pav. = H/6, atendido o mínimo de 2,50 m.</td><td></td>
                </tr>
                <tr>
                    <td>Comércio e Serviço Vicinal, de Bairro e Setorial</td>
                    <td>1</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td></td><td></td>
                </tr>
                <tr>
                    <td>Posto de Abastecimento (2)</td>
                    <td>1</td><td>2</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td><td></td>
                </tr>
                <tr>
                    <td>Indústria Tipo 1 (4)</td>
                    <td>-</td><td>-</td><td>400</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                </tr>
            </tbody>
        </table>
        <small>
        <ul style="font-size: 13px;padding: 10px 10px 0 10px;">
                <li>(1) Uma habitação unifamiliar por lote.</li>
                <li>(2) Atender regulamentação específica.</li>
                <li>(3) Para conjuntos habitacionais de habitação coletiva e unifamiliar em série a área máxima do terreno deverá ser de até 20.000 (vinte mil) m².</li>
                <li>(4) Somente alvará de licença para localização em edificação existente.</li>
                <li style="font-weight: bold;">Fonte: Lei nº 15.511_2019 Atualizada 19.11.2019.</li>
            </ul>
        </small>
    </div>`;
    } else if (zona === "EAC") {
        html = `<div id="html_zona" class="ordercalc">
        <h5 class="titulotabextra">Quadro VIII - Eixo Presidente Affonso Camargo (EAC / Outras Vias)</h5>
        <table class="ptable" id="tabela-eac">
            <thead>
                <tr>
                    <th>Usos</th>
                    <th>Coef. de Aproveitamento</th>
                    <th>Altura (pav.)</th>
                    <th>Porte (m²)</th>
                    <th>Taxa de Ocupação</th>
                    <th>Recuo</th>
                    <th>Taxa de Permeabilidade</th>
                    <th>Afast. das Divisas</th>
                    <th>Lote Padrão</th>
                </tr>
            </thead>
            <tbody>
            <tr><th colspan="9" style="text-align:left;">Usos Habitacionais</th></tr>
                <tr>
                    <td>Habitação Unifamiliar (1)</td>
                    <td>1</td><td>2</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td>-</td><td>15 x 450</td>
                </tr>
                <tr>
                    <td>Habitação Coletiva</td>
                    <td>1,5</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td>
                    <td>Até 2 pav.: facultado. Acima de 2 pav.: H/6 contado do térreo, atendido o mínimo de 2,5 m.</td>
                    <td></td>
                </tr>
                <tr>
                    <td>Habitação Institucional</td>
                    <td>1,5</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td></td><td></td>
                </tr>
                <tr>
                    <td>Habitação Transitória 1</td>
                    <td>1,5</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td></td><td></td>
                </tr>
                <tr>
                    <td>Empreendimento Inclusivo de HIS (2)</td>
                    <td>1,5</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td></td><td></td>
                </tr>
                <tr><th colspan="9" style="text-align:left;">Usos Não Habitacionais</th></tr>
                <tr>
                    <td>Comunitário 1 e 2</td>
                    <td>1</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td>
                    <td>Até 2 pav.: facultado. Acima de 2 pav.: H/6 contado do térreo, atendido o mínimo de 2,5 m.</td>
                    <td></td>
                </tr>
                <tr>
                    <td>Comércio e Serviço Vicinal, de Bairro e Setorial</td>
                    <td>1</td><td>4</td><td>-</td><td>50%</td><td>5 m</td><td>25% (2)</td><td></td><td></td>
                </tr>
                <tr>
                    <td>Posto de Abastecimento (2)</td>
                    <td>1</td><td>2</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                </tr>
                <tr>
                    <td>Indústria Tipo 1 (3)</td>
                    <td>-</td><td>-</td><td>400</td><td>-</td><td>-</td><td>-</td><td>-</td><td></td>
                </tr>
            </tbody>
        </table>
        <small>
        <ul style="font-size: 13px;padding: 10px 10px 0 10px;">
                <li>(1) Uma habitação unifamiliar por lote.</li>
                <li>(2) Atender regulamentação específica.</li>
                <li>(3) Somente alvará de licença para localização em edificação existente.</li>
                <li style="font-weight: bold;">Fonte: Lei nº 15.511_2019 Atualizada 19.11.2019.</li>
            </ul>
        </small>
    </div>`;

    }

    if (html) {
        const container = document.getElementById("zona_container") || document.body;
        container.insertAdjacentHTML("beforeend", html);
    }
}