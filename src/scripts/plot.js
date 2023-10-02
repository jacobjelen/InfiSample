const ctx = document.getElementById('liveChart').getContext('2d');

const chartConfig = {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'X - Left to Right',
                data: [],
                borderColor: 'red',
                borderWidth: 1,
                fill: false
            },
            {
                label: 'Y - Heal to Toe',
                data: [],
                borderColor: 'green',
                borderWidth: 1,
                fill: false
            },
            {
                label: 'Z - Pressure',
                data: [],
                borderColor: '#F46A24',
                borderWidth: 0,
                fill: true,
                backgroundColor: 'rgba(244, 106, 36, 0.1)', // Fill color
                yAxisID: 'press' // has it's own axis
            }
        ]
    },
    options: {
        responsive: true,
        animation: false,
        radius: 0,
        scales: {
            x: {
                type: 'time',
                position: 'bottom'
            },
            y: {
                // beginAtZero: true
            },
            'press': {
                position: 'right',
                // beginAtZero: true
                ticks: {
                    font: {
                        // size: 14
                    },
                    color: '#F46A24' // Tick color
                }
                
            }
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy' // 'x' for horizontal panning, 'y' for vertical panning, 'xy' for both
                },
                zoom: {
                    enabled: true,
                    mode: 'xy' // 'x' for horizontal zooming, 'y' for vertical zooming, 'xy' for both
                }
            }
        }
    }
};

const liveChart = new Chart(ctx, chartConfig);

// Simulate live data
// setInterval(() => {
//     const now = Date.now();

//     // Add new data
//     chartConfig.data.labels.push(now);
//     chartConfig.data.datasets[0].data.push(Math.random() * 100); // Random X value
//     chartConfig.data.datasets[1].data.push(Math.random() * 100); // Random Y value
//     chartConfig.data.datasets[2].data.push(Math.random() * 100); // Random Z value

//     // Remove old data to keep maxDataPoints
//     if (chartConfig.data.labels.length > maxDataPoints) {
//         chartConfig.data.labels.shift();
//         chartConfig.data.datasets.forEach(dataset => dataset.data.shift());
//     }

//     liveChart.update();
// }, 2000); // Update every 2 seconds
