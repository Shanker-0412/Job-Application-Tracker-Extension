document.addEventListener('DOMContentLoaded', () => {
  const storeButton = document.getElementById('storeApplication');
  const checkNowButton = document.getElementById('checkNow');
  const applicationsList = document.getElementById('applicationsList');

  storeButton.addEventListener('click', storeCurrentApplication);
  checkNowButton.addEventListener('click', checkApplicationsNow);

  function storeCurrentApplication() {
      chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
          const currentTab = tabs[0];
          const companyName = await promptForInput('Enter the company name:');
          if (!companyName) return;
  
          const status = await promptForInput('Enter the application status:');
          if (!status) return;

          const applicationLink = await promptForInput('Enter the application link (URL):');
          if (!applicationLink) return;
  
          const newApplication = {
              company: companyName,
              status: status,
              url: applicationLink,
              date: new Date().toISOString(),
              lastChecked: new Date().toISOString()
          };
  
          chrome.storage.sync.get({applications: []}, (data) => {
              const applications = data.applications;
              applications.push(newApplication);
              chrome.storage.sync.set({applications: applications}, () => {
                  renderApplications();
              });
          });
      });
  }

  function checkApplicationsNow() {
      chrome.runtime.sendMessage({action: "checkNow"}, (response) => {
          console.log(response.message);
          renderApplications(); // Refresh the list to show any updates
      });
  }

  function promptForInput(message) {
      return new Promise((resolve) => {
          const input = prompt(message);
          resolve(input ? input.trim() : null);
      });
  }

  function renderApplications() {
      chrome.storage.sync.get({applications: []}, (data) => {
          applicationsList.innerHTML = '';
          data.applications.forEach((app, index) => {
              const appElement = document.createElement('div');
              appElement.className = 'application';
              appElement.innerHTML = `
                  <a href="${app.url}" target="_blank" class="app-link">${app.company}</a>
                  <span class="app-status">${app.status}</span>
                  <span class="app-date">Applied: ${new Date(app.date).toLocaleDateString()}</span>
                  <span class="app-checked">Last checked: ${new Date(app.lastChecked).toLocaleString()}</span>
                  <button class="delete-btn" data-index="${index}">Delete</button>
              `;
              applicationsList.appendChild(appElement);
          });

          // Add event listeners to delete buttons
          document.querySelectorAll('.delete-btn').forEach(btn => {
              btn.addEventListener('click', deleteApplication);
          });
      });
  }

  function deleteApplication(event) {
      const index = parseInt(event.target.getAttribute('data-index'));
      chrome.storage.sync.get({applications: []}, (data) => {
          const applications = data.applications;
          applications.splice(index, 1);
          chrome.storage.sync.set({applications: applications}, () => {
              renderApplications();
          });
      });
  }

  // Initial render
  renderApplications();
});
