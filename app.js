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
        console.log(error);
    }
}

function formatDate(dateTimeInput) {
    let date = new Date(dateTimeInput);
    let formattedDateTime = date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0') + 'T' + date.getHours().toString().padStart(2, '0') + '%3A' + date.getMinutes().toString().padStart(2, '0');
    console.log(formattedDateTime);
    return formattedDateTime;
}

// funciones de graficado y publicación de data
function doughnut_report(n_problems_close, n_problems_open) {
    var ctx = document.getElementById('doughnut-chart').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Closed', 'Open'],
            datasets: [{
                label: 'Problems',
                data: [n_problems_close, n_problems_open],
                backgroundColor: ['#36A2EB', '#FF6384'],
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

}

// Principal orquestador
async function report(event) {
    event.preventDefault();
    tenant = document.getElementById('tenant').value;
    token = document.getElementById('token').value;
    var headers = {
        'Content-Type': 'application/json; charset=utf-8',
        "Authorization": "Api-Token " + token
    };
    from_date = formatDate(document.getElementById('from').value);
    to_date = formatDate(document.getElementById('to').value);

    const jsonDataClose = await requestAPI("https://" + tenant + "/api/v2/problems?from=" + from_date + "&to=" + to_date, headers);
    problems_details = jsonDataClose.problems;

    n_problems_close = problems_details.reduce((count, problem) => problem.status === 'CLOSED' ? count + 1 : count, 0);
    n_problems_open = problems_details.reduce((count, problem) => problem.status === 'OPEN' ? count + 1 : count, 0);
    console.log(n_problems_close);
    console.log(n_problems_open);


    doughnut_report(n_problems_close, n_problems_open);
}