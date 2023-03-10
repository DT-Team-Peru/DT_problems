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
function doughnut_report1(n_problems_close, n_problems_open) {
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
    document.getElementById("token").style.display = "none";
    var headers = {
        'Content-Type': 'application/json; charset=utf-8',
        "Authorization": "Api-Token " + token
    };
    from_date = formatDate(new Date(new Date(document.getElementById('from').value).getTime() + 5 * 60 * 60 * 1000))
    to_date = formatDate(new Date(new Date(document.getElementById('to').value).getTime() + 5 * 60 * 60 * 1000))

    const loadingDiv = document.createElement("div");
    loadingDiv.setAttribute("id", "loading");

    const loadingImg = document.createElement("img");
    loadingImg.setAttribute("src", "static/images/loading-icon.gif");

    loadingDiv.appendChild(loadingImg);
    document.body.appendChild(loadingDiv);


    url = "https://" + tenant + "/api/v2/problems?pageSize=500&from=" + from_date + "&to=" + to_date;
    problems_details = [];

    while (url) {
        const jsonData = await requestAPI(url, headers);
        problems_details = problems_details.concat(jsonData.problems);
        url = jsonData.nextPageKey ? `https://${tenant}/api/v2/problems?nextPageKey=${jsonData.nextPageKey}` : null;
    }

    n_problems_close = problems_details.reduce((count, problem) => problem.status === 'CLOSED' ? count + 1 : count, 0);
    n_problems_open = problems_details.reduce((count, problem) => problem.status === 'OPEN' ? count + 1 : count, 0);

    n_errors = problems_details.reduce((count, problem) => problem.severityLevel === 'ERROR' ? count + 1 : count, 0);
    n_custom_alerts = problems_details.reduce((count, problem) => problem.severityLevel === 'CUSTOM_ALERT' ? count + 1 : count, 0);
    n_performance = problems_details.reduce((count, problem) => problem.severityLevel === 'PERFORMANCE' ? count + 1 : count, 0);
    n_availability = problems_details.reduce((count, problem) => problem.severityLevel === 'AVAILABILITY' ? count + 1 : count, 0);
    n_resource_contention = problems_details.reduce((count, problem) => problem.severityLevel === 'RESOURCE_CONTENTION' ? count + 1 : count, 0);
    
    doughnut_report(n_problems_close, n_problems_open, n_errors, n_custom_alerts, n_performance, n_availability, n_resource_contention)

    var container = document.getElementById('hot-app');
    container.innerHTML = "";
    var hot = new Handsontable(container, {
        data: problems_details,
        colHeaders: ['details', 'displayId', 'title', 'impactLevel', 'severityLevel', 'status', 'startTime', 'endTime'],
        columns: [
            {
                data: 'problemId',
                type: 'text',
                renderer: function (instance, td, row, col, prop, value, cellProperties) {
                    td.innerHTML = '<a href="#" onclick="event.preventDefault(); problem_details(\'' + value + '\');">click</a>';
                    return td;
                }
            },
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

async function problem_details(problem_id) {
    const tenant = document.getElementById('tenant').value;
    const token = inputValue;
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Api-Token ${token}`
    };
    const url = `https://${tenant}/api/v2/problems/${problem_id}`;
    const jsonDetails = await requestAPI(url, headers);
    //console.log(jsonDetails);

    // Check if rootCauseEntityId and rootCauseEntityType exist before accessing them
    const rootCauseEntityId = jsonDetails.rootCauseEntity?.entityId?.id || 'None';
    const rootCauseEntityType = jsonDetails.rootCauseEntity?.entityId?.type || 'None';
    const rootCauseEntityName = jsonDetails.rootCauseEntity?.name?.name || 'None';

    const date_options = { timeZoneName: 'short', hour12: false };
    // Build the HTML for the modal
    const modalBody = `
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <h5>Title: ${jsonDetails.title} (${jsonDetails.affectedEntities.length} affected entities)</h5>
            <p>Impact level: ${jsonDetails.impactLevel}</p>
            <p>Start time: ${new Date(jsonDetails.startTime).toLocaleString('es', date_options)}</p>
            <p>End time: ${jsonDetails.status === 'OPEN' ? 'N/A' : new Date(jsonDetails.endTime).toLocaleString('es', date_options)}</p>
            <p>Status: ${jsonDetails.status}</p>
            <p>Management Zone: ${jsonDetails.managementZones.map(mz => `${mz.name}`).join(', ')}</p>
          </div>
        </div>
        <div class="row">
          <div class="col-6">
            <h5>Business impact analysis:</h5>
            <ul>
              ${jsonDetails.impactAnalysis.impacts.map(impact => `
                <li>
                  <p>Impact type: ${impact.impactType}</p>
                  <p>Estimated affected users: ${impact.estimatedAffectedUsers}</p>
                  <p>Impacted entity name: ${impact.impactedEntity.name}</p>
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="col-6">
            <h5>Root cause:</h5>
            <p>Root cause entity ID: ${rootCauseEntityId}</p>
            <p>Root cause entity type: ${rootCauseEntityType}</p>
            <p>Root cause entity name: ${rootCauseEntityName}</p>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <h5>Recent comments:</h5>
            <ul>
              ${jsonDetails.recentComments.comments.map(comment => `
                <li>
                  <p>Author: ${comment.author}</p>
                  <p>Timestamp: ${new Date(comment.timestamp)}</p>
                  <p>Comment: ${comment.comment}</p>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    // Create the modal and show it
    const modal = new bootstrap.Modal(document.getElementById('problemDetailsModal'));
    const modalBodyElement = document.getElementById('problem-details-modal-body');
    modalBodyElement.innerHTML = modalBody;
    modal.show();
}

function doughnut_report(n_problems_close, n_problems_open, n_errors, n_custom_alerts, n_performance, n_availability, n_resource_contention) {
    var canvas1 = document.getElementById('doughnut-chart-1');
    if (canvas1.chart) {
        canvas1.chart.destroy();
    }
    canvas1.innerHTML = "";
    var ctx1 = canvas1.getContext('2d');

    var data1 = {
        datasets: [{
            data: [n_problems_close, n_problems_open],
            backgroundColor: ["#6F2DA8", "#B4DC00"],
            label: 'Problems'
        }],
        labels: ['Closed', 'Open']
    };
    var options1 = {
        responsive: true,
        legend: {
            position: 'right'
        },
        title: {
            display: true,
            text: 'Open and Closed Problems'
        },
        animation: {
            animateScale: true,
            animateRotate: true
        }
    };
    var chart1 = new Chart(ctx1, {
        type: 'doughnut',
        data: data1,
        options: options1
    });
    canvas1.chart = chart1;

    var canvas2 = document.getElementById('doughnut-chart-2');
    if (canvas2.chart) {
        canvas2.chart.destroy();
    }
    canvas2.innerHTML = "";
    var ctx2 = canvas2.getContext('2d');

    var data2 = {
        datasets: [{
            data: [n_errors, n_custom_alerts, n_performance, n_availability, n_resource_contention],
            backgroundColor: ["#FF5733", "#FFC300", "#00A6B4", "#BCE55C", "#FF6B6B"],
            label: 'Severity Levels'
        }],
        labels: ['Errors', 'Custom Alerts', 'Performance', 'Availability', 'Resource Contention']
    };
    var options2 = {
        responsive: true,
        legend: {
            position: 'right'
        },
        title: {
            display: true,
            text: 'Severity Levels'
        },
        animation: {
            animateScale: true,
            animateRotate: true
        },
        plugins: {
            doughnutlabel: {
                labels: [
                    {
                        text: 'Severity Levels',
                        font: {
                            size: '20'
                        }
                    }
                ]
            }
        }
    };
    var chart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: data2,
        options: options2
    });
    canvas2.chart = chart2;
}
