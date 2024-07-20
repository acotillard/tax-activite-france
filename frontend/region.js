document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const regionId = urlParams.get('id');

    if (regionId) {
        try {
            const regionResponse = await fetch(`/regions/${regionId}`);
            const region = await regionResponse.json();
            document.getElementById('region-name').textContent = region.name;

            const detailsResponse = await fetch(`/regions/${regionId}/details`);
            const details = await detailsResponse.json();

            const regionDetailsDiv = document.getElementById('region-details');
            const detailsHTML = details.map(detail => {
                return `<p>${detail.activity}: ${detail.rate}%</p>`;
            }).join('');
            regionDetailsDiv.innerHTML = detailsHTML;

            const editFieldsDiv = document.getElementById('edit-fields');
            const editFieldsHTML = details.map(detail => {
                return `
                    <div class="mb-2">
                        <label class="block text-gray-700 text-sm font-bold mb-1">${detail.activity}:</label>
                        <input type="number" name="${detail.activity}" value="${detail.rate}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                    </div>
                `;
            }).join('');
            editFieldsDiv.innerHTML = editFieldsHTML;

            const editBtn = document.getElementById('edit-btn');
            editBtn.addEventListener('click', () => {
                regionDetailsDiv.classList.add('hidden');
                document.getElementById('edit-form').classList.remove('hidden');
                document.getElementById('add-activity-form').classList.remove('hidden');
            });

            const cancelBtn = document.getElementById('cancel-btn');
            cancelBtn.addEventListener('click', () => {
                document.getElementById('edit-form').classList.add('hidden');
                document.getElementById('add-activity-form').classList.add('hidden');
                regionDetailsDiv.classList.remove('hidden');
            });

            const editForm = document.getElementById('edit-form');
            editForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const formData = new FormData(event.target);
                const updates = [];
                for (const [activity, rate] of formData.entries()) {
                    updates.push({ activity, rate });
                }

                try {
                    await fetch(`/regions/${regionId}/update`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ updates })
                    });
                    location.reload();  // Recharger la page pour refléter les mises à jour
                } catch (error) {
                    console.error('Error updating region details:', error);
                }
            });

            const addActivityForm = document.getElementById('add-activity-form');
            addActivityForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const newActivity = document.getElementById('new-activity').value;
                const newRate = document.getElementById('new-rate').value;

                try {
                    await fetch(`/regions/${regionId}/add-activity`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ activity: newActivity, rate: newRate })
                    });
                    location.reload();  // Recharger la page pour refléter les mises à jour
                } catch (error) {
                    console.error('Error adding new activity:', error);
                }
            });

            // Fetch activities for autocompletion
            const activitiesResponse = await fetch('/activities');
            const activities = await activitiesResponse.json();
            const activitiesList = document.getElementById('activities-list');
            activities.forEach(activity => {
                const option = document.createElement('option');
                option.value = activity.name;
                activitiesList.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching region details:', error);
        }
    } else {
        console.error('No region ID provided in the URL');
    }
});
