
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

async function doughnut_report(tenant, headers) {
    const jsonDataClose = await requestAPI("https://" + tenant + "/api/v2/problems?from=2022-12-05T00%3A00&to=2023-01-21T00%3A00&problemSelector=status%28%22closed%22%29", headers);
    n_problems_close = jsonDataClose.totalCount;
    const jsonDataOpen = await requestAPI("https://" + tenant + "/api/v2/problems?from=2022-12-05T00%3A00&to=2023-01-21T00%3A00&problemSelector=status%28%22open%22%29", headers);
    n_problems_open = jsonDataOpen.totalCount;

    var ctx = document.getElementById('doughnut-chart').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Closed: ' + n_problems_close, 'Open: ' + n_problems_open],
            datasets: [{
                label: '# of Issues',
                data: [n_problems_close, n_problems_open],
                backgroundColor: ['#36A2EB', '#FF6384'],
                borderWidth: 0
            }]
        },
        options: {
            legend: {
                position: 'top',
                labels: {
                    fontColor: '#242424'
                }
            },
            title: {
                display: true,
                text: 'Cantidad de problemas por estado'
            }
        }
    });
}

function report() {
    tenant = document.getElementById('tenant').value;
    token = document.getElementById('token').value;
    var headers = {
        'Content-Type': 'application/json; charset=utf-8',
        "Authorization": "Api-Token " + token
    };
    doughnut_report(tenant, headers);
}