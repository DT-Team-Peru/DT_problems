// funciones de formato y utilitarios
async function requestAPI(url, headers) {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: headers
        });
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        //console.log(error);
    }
}

function formatDate(dateTimeInput) {
    let date = new Date(dateTimeInput);
    let formattedDateTime = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0') + 'T' + date.getHours().toString().padStart(2, '0') + '%3A' + date.getMinutes().toString().padStart(2, '0');
    return formattedDateTime;
}

var inputValue;

document.getElementById("token").addEventListener("input", Event => {
    inputValue = document.getElementById("token").value;
    document.getElementById("token").value = "**no está permitido ver el token**";
});

// funciones de graficado y publicación de data
function doughnut_report(n_problems_close, n_problems_open) {
    var canvas = document.getElementById('doughnut-chart');
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    canvas.innerHTML = "";
    var ctx = canvas.getContext('2d');
    var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Closed', 'Open'],
            datasets: [{
                label: 'Problems',
                data: [n_problems_close, n_problems_open],
                backgroundColor: ['#6F2DA8', '#B4DC00'],
                borderWidth: 0
            }]
        },
        options: {
            legend: {
                position: 'top',
                labels: {
                    fontColor: '#242424',
                    boxWidth: 20,
                    padding: 10,
                    generateLabels: function (chart) {
                        var data = chart.data;
                        return data.labels.map(function (label, i) {
                            var meta = chart.getDatasetMeta(0);
                            var ds = data.datasets[0];
                            var arc = meta.data[i];
                            var custom = arc && arc.custom || {};
                            var getValueAtIndexOrDefault = Chart.helpers.getValueAtIndexOrDefault;
                            var arcOpts = chart.options.elements.arc;
                            var fill = custom.backgroundColor ? custom.backgroundColor : getValueAtIndexOrDefault(ds.backgroundColor, i, arcOpts.backgroundColor);
                            var stroke = custom.borderColor ? custom.borderColor : getValueAtIndexOrDefault(ds.borderColor, i, arcOpts.borderColor);
                            var bw = custom.borderWidth ? custom.borderWidth : getValueAtIndexOrDefault(ds.borderWidth, i, arcOpts.borderWidth);
                            return {
                                text: label + ': ' + ds.data[i],
                                fillStyle: fill,
                                strokeStyle: stroke,
                                lineWidth: bw,
                                hidden: isNaN(ds.data[i]) || meta.data[i].hidden,
                                index: i
                            };
                        });
                    }
                }
            },
            title: {
                display: true,
                text: 'Cantidad de Problemas por estado'
            }
        }
    });
    canvas.chart = chart;

}

// Principal orquestador
async function report(event) {
    event.preventDefault();
    tenant = document.getElementById('tenant').value;
    //token = document.getElementById('token').value;
    token = inputValue;
    var headers = {
        'Content-Type': 'application/json; charset=utf-8',
        "Authorization": "Api-Token " + token
    };
    from_date = formatDate(document.getElementById('from').value);
    to_date = formatDate(document.getElementById('to').value);
    
    const loadingDiv = document.createElement("div");
    loadingDiv.setAttribute("id", "loading");

    const loadingImg = document.createElement("img");
    loadingImg.setAttribute("src", "static/images/loading-icon.gif");

    loadingDiv.appendChild(loadingImg);
    document.body.appendChild(loadingDiv);


    url = "https://" + tenant + "/api/v2/problems?pageSize=500&from=" + from_date + "&to=" + to_date;
    problems_details = [];

    while (url){
        const jsonData = await requestAPI(url, headers);
        problems_details = problems_details.concat(jsonData.problems);
        url = jsonData.nextPageKey ? `https://${tenant}/api/v2/problems?nextPageKey=${jsonData.nextPageKey}` : null;
    }

    n_problems_close = problems_details.reduce((count, problem) => problem.status === 'CLOSED' ? count + 1 : count, 0);
    n_problems_open = problems_details.reduce((count, problem) => problem.status === 'OPEN' ? count + 1 : count, 0);

    doughnut_report(n_problems_close, n_problems_open);

    var container = document.getElementById('hot-app');
    container.innerHTML = "";
    var hot = new Handsontable(container, {
        data: problems_details,
        colHeaders: ['displayId', 'title', 'impactLevel', 'severityLevel', 'status', 'startTime', 'endTime'],
        columns: [
            { data: 'displayId', type: 'text' },
            { data: 'title', type: 'text' },
            { data: 'impactLevel', type: 'text' },
            { data: 'severityLevel', type: 'text' },
            {
                data: 'status',
                renderer: function (instance, td, row, col, prop, value, cellProperties) {
                    if (value === 'OPEN') {
                        td.style.color = '#FF6384';
                    } else if (value === 'CLOSED') {
                        td.style.color = '#36A2EB';
                    }
                    td.innerHTML = value;
                    return td;
                }
            },
            {
                data: 'startTime',
                renderer: function (instance, td, row, col, prop, value, cellProperties) {
                    var date = new Date(value);
                    td.innerHTML = date.toLocaleString();
                    return td;
                }
            },
            {
                data: 'endTime',
                renderer: function (instance, td, row, col, prop, value, cellProperties) {
                    if (value < 0) {
                        td.innerHTML = '';
                        value = '';
                    } else {
                        var date = new Date(value);
                        td.innerHTML = date.toLocaleString();
                    }
                    return td;
                }
            },
        ],
        rowHeaders: true,
        dropdownMenu: true,
        filters: true,
        licenseKey: 'non-commercial-and-evaluation',
        stretchH: 'all',
        height: 'auto',
        width: '100%'
    });

    document.getElementById("loading").remove();
}