const ctx = document.getElementById('liveChart').getContext('2d');
const maxDataPoints = 10; // Maximum number of data points to show on the chart

const chartConfig = {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'X Value',
                data: [],
                borderColor: 'red',
                fill: false
            },
            {
                label: 'Y Value',
                data: [],
                borderColor: 'green',
                fill: false
            },
            {
                label: 'Z Value',
                data: [],
                borderColor: 'blue',
                fill: false
            }
        ]
    },
    options: {
        responsive: true,
        animation: false,
        radius: 0,
        scales: {
            x: {
                beginAtZero: true
                // realtime: {
                //     duration: 20000, // Display data for the last 20 seconds
                //     // refresh: 1000,   // Fetch new data every 1 second
                //     // delay: 2000      // Delay the latest data point by 2 seconds
                // }
            },
            y: {
                beginAtZero: true
            }
        },
        
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy'
                },
                zoom: {
                    enabled: true,
                    mode: 'xy'
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
