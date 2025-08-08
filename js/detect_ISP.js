// Визначення провайдера
import { IPINFO_URL, IPINFO_TOKEN } from './config.js';

async function detectISP() {
    try {
        const res = await fetch(`${IPINFO_URL}?token=${IPINFO_TOKEN}`);
        if (!res.ok) {
            throw new Error(`IP info request failed: ${res.status}`);
        }
        const data = await res.json();

        // Визначаємо operator
        operator = operators[data.org] ?? data.org;   // якщо є ключ — беремо мапу, інакше data.org

        // Заповнюємо поля в DOM
        document.getElementById('ip').textContent       = data.ip       || '-';
        document.getElementById('hostname').textContent = data.hostname || '-';
        document.getElementById('city').textContent     = data.city     || '-';
        document.getElementById('region').textContent   = data.region   || '-';
        document.getElementById('country').textContent  = data.country  || '-';
        document.getElementById('loc').textContent      = data.loc      || '-';
        document.getElementById('org').textContent      = data.org      || '-';
        document.getElementById('postal').textContent   = data.postal   || '-';
        document.getElementById('timezone').textContent = data.timezone || '-';

        // Відображаємо знайдений оператор
        const operatorEl = document.getElementById('operator');
        operatorEl.textContent = operator || '-';
        operatorEl.classList.remove('operator-vodafone', 'operator-kyivstar', 'operator-lifecell');
        if (data.org === 'AS21497 PrJSC VF UKRAINE') {
            operatorEl.classList.add('operator-vodafone');
        } else if (data.org === 'AS15895 "Kyivstar" PJSC') {
            operatorEl.classList.add('operator-kyivstar');
        } else if (data.org === 'AS34058 Limited Liability Company "lifecell"') {
            operatorEl.classList.add('operator-lifecell');
        }
    } catch (e) {
        const infoEl = document.getElementById('info');
        if (infoEl) {
            infoEl.innerHTML = '<div class="error-message">Не вдалося отримати інформацію про з’єднання</div>';
        }
        if (typeof addLog === 'function') {
            addLog('detectISP error: ' + e.message);
        }
    }
}
document.addEventListener('DOMContentLoaded', detectISP);
