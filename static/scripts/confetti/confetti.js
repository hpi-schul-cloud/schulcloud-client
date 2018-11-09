if(!window.confetti){
    window.confetti = (event)=>{
        const confettiWrapper = document.querySelector(".confetti-wrapper");
        const confettiBase = document.createElement('div');
        for(let i = 0; i<Math.min(Math.ceil(Math.sqrt(confettiWrapper.offsetWidth * confettiWrapper.offsetHeight) / 8), 120); i++){
            const confetti = confettiBase.cloneNode();
            confetti.id = `confetti-${i}`;
            confettiWrapper.appendChild(confetti);
        }
    }
    window.addEventListener('DOMContentLoaded', window.confetti);
}