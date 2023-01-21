
var n_problems_close = 0;
var n_problems_open = 0;

var tenant = "";
var token = "";

function data_request(){
    headers = {
        'Content-Type': 'application/json; charset=utf-8',
        "Authorization": "Api-Token "+token
      };
    
    fetch("https://"+tenant+"/api/v2/problems?from=2022-12-05T00%3A00&to=2023-01-21T00%3A00&problemSelector=status%28%22open%22%29", {
      method: "GET",
      headers: headers
    })
      .then(response => response.json())
      .then(data => {
        console.log(data['totalCount']);
        n_problems_open = data['totalCount'];
    })
      .catch(error => console.log(error));
    
    fetch("https://"+tenant+"/api/v2/problems?from=2022-12-05T00%3A00&to=2023-01-21T00%3A00&problemSelector=status%28%22closed%22%29", {
        method: "GET",
        headers: headers
      })
        .then(response => response.json())
        .then(data => {
            console.log(data['totalCount']);
            n_problems_close = data['totalCount']
        })
        .catch(error => console.log(error));
      
        
}

function doughnut_report(){
    var ctx = document.getElementById('doughnut-chart').getContext('2d');
    var chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Closed: '+n_problems_close, 'Open: '+n_problems_open],
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

function report(){
    tenant = document.getElementById('tenant').value;
    token = document.getElementById('token').value;
    data_request();
    doughnut_report();
}
