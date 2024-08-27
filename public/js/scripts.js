// scripts.js
document.addEventListener('DOMContentLoaded', () => {
    const starContainers = document.querySelectorAll('.stars');
    
    starContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        const hiddenInput = container.nextElementSibling;
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const value = stars.length - index;
                hiddenInput.value = value;
                
                stars.forEach(s => s.classList.remove('selected'));
                for (let i = stars.length - 1; i >= index; i--) {
                    stars[i].classList.add('selected');
                }
            });
        });
    });

    document.querySelector('form').addEventListener('submit', function(e) {
        const requiredInputs = this.querySelectorAll('input[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                e.preventDefault();
                alert('Please rate all categories before submitting.');
                return false;
            }
        });

        if (isValid) {
            this.submit();
        }
    });
});