(function() {
    const indexerEndpoint = 'https://mainnet-idx.voi.nodely.dev/v2/accounts';
    const params = {
        'limit': 1000,
        'exclude': 'all'
    };
    let totalAccounts = 0;
    let accounts = [];
    let hasErrorOccurred = false; // Track if any errors occurred

    function fetchAccounts(url) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Filter accounts with status 'Online' client-side
                const onlineAccounts = data.accounts.filter(account => account.status === 'Online');
                accounts = accounts.concat(onlineAccounts);
                totalAccounts += onlineAccounts.length;
                document.getElementById('count').innerText = totalAccounts;

                // Check if the 'next-token' is valid and exists before proceeding to the next page
                if (data['next-token'] && data['next-token'] !== null && data['next-token'] !== '') {
                    const nextUrl = `${indexerEndpoint}?${new URLSearchParams({
                        ...params,
                        'next': data['next-token']
                    })}`;
                    setTimeout(() => {
                        fetchAccounts(nextUrl);
                    }, 10);  // 100ms delay to limit to 10 TPS
                } else {
                    // All data fetched, sort by amount, and display the table
                    sortAccountsByAmount();  // Sort the accounts array before displaying
                    displayAccounts();
                }
            })
            .catch(error => {
                console.error('Error fetching accounts:', error);
                hasErrorOccurred = true;  // Mark that an error has occurred
                displayAccounts();  // Display whatever data we've gathered so far
                document.getElementById('loading').innerText = 'Error loading some data, displaying available data.';
            });
    }

    // Sort accounts by amount in descending order
    function sortAccountsByAmount() {
        accounts.sort((a, b) => b.amount - a.amount);
    }

    function displayAccounts() {
        const tableBody = document.getElementById('accounts-body');
        accounts.forEach(account => {
            const tr = document.createElement('tr');

            // Address
            const tdAddress = document.createElement('td');
            tdAddress.innerText = account.address;
            tr.appendChild(tdAddress);

            // Amount
            const tdAmount = document.createElement('td');
            tdAmount.innerText = formatVoiAmount(account.amount) + ' VOI';
            tr.appendChild(tdAmount);

            // Key Expiration Block
            const tdExpiration = document.createElement('td');
            if (account.participation && account.participation['vote-last-valid']) {
                tdExpiration.innerText = account.participation['vote-last-valid'];
            } else {
                tdExpiration.innerText = 'N/A';
            }
            tr.appendChild(tdExpiration);

            tableBody.appendChild(tr);
        });

        document.getElementById('loading').style.display = 'none';
        if (accounts.length > 0) {
            document.getElementById('accounts-table').style.display = 'table';
        } else {
            document.getElementById('loading').innerText = hasErrorOccurred
                ? 'No data could be fetched due to errors.'
                : 'No online participation accounts found.';
        }
    }

    // Helper function to format amount in Voi (from microAlgos)
    function formatVoiAmount(sweenieWeenies) {
        return (sweenieWeenies / 1e6).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
    }

    // Start fetching data
    const initialUrl = `${indexerEndpoint}?${new URLSearchParams(params)}`;
    fetchAccounts(initialUrl);
})();
