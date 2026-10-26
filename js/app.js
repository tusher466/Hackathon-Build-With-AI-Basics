// Rebound - Main UI Controller
document.addEventListener('DOMContentLoaded', function() {
  const welcomeView = document.getElementById('welcome-view');
  const btnWelcomeAdd = document.getElementById('btn-welcome-add');
  const btnOpenExams = document.getElementById('btn-open-exams');

  // Wire Welcome button to Exams button for now
  if (btnWelcomeAdd && btnOpenExams) {
    btnWelcomeAdd.addEventListener('click', function() {
      btnOpenExams.click();
    });
  }

  console.log('Rebound initialized successfully.');
});
