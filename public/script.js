(function () {
    document.getElementById('testForm').addEventListener('submit', event => {
        event.preventDefault();
        const stockOne = event.target[0].value;
        const stockTwo = event.target[1].value;
        const like = event.target[2].checked;

        fetch(`/api/stock-prices?stock=${stockOne}&stock=${stockTwo}&like=${like}`)
            .then(res => res.json())
            .then(data => document.getElementById('jsonResult').innerText = JSON.stringify(data))

    });

    document.getElementById('testForm2').addEventListener('submit', event => {
        event.preventDefault();
        const stock = event.target[0].value;
        const like = event.target[1].checked;

        fetch(`/api/stock-prices?stock=${stock}&like=${like}`)
            .then(res => res.json())
            .then(data => document.getElementById('jsonResult').innerText = JSON.stringify(data))
    });
})();