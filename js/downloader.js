function downloadResults() {
    const history = window.fullTestHistory || [];
    const bpm = document.getElementById('val-bpm').innerText;
    const ur = document.getElementById('val-ur').innerText;

    if (history.length === 0) return;

    let content = "MORGUN STREAM TEST RESULT\n";
    content += "---------------------------------\n";
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `Final BPM: ${bpm}\n`;
    content += `Unstable Rate: ${ur}\n`;
    content += `Total Inputs: ${history.length}\n`;
    content += "---------------------------------\n";
    content += "KEY\t|\tTIME (ms)\t|\tHOLD (ms)\n";
    content += "---------------------------------\n";

    history.forEach(item => {
        content += `${item.key}\t|\t${item.timestamp}\t\t|\t${item.duration}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morgun_bpm_test_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
