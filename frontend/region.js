document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const regionId = urlParams.get('id');

    const editForm = document.getElementById('edit-form');
    const addActivityForm = document.getElementById('add-activity-form');
    const regionDetailsDiv = document.getElementById('region-details');
    const editFieldsDiv = document.getElementById('edit-fields');
    const newActivitiesDiv = document.getElementById('new-activities');
    const newActivitiesListDiv = document.getElementById('new-activities-list');
    const newActivityBtn = document.getElementById('add-activity-btn');
    const activityWarning = document.getElementById('activity-warning');
    let activitiesToDelete = [];
    let activitiesToAdd = [];

    if (regionId) {
        try {
            const regionResponse = await fetch(`/regions/${regionId}`);
            const region = await regionResponse.json();
            document.getElementById('region-name').textContent = region.name;

            const detailsResponse = await fetch(`/regions/${regionId}/details`);
            const details = await detailsResponse.json();

            const detailsHTML = details.map(detail => {
                return `<p>${detail.activity}: ${detail.rate}%</p>`;
            }).join('');
            regionDetailsDiv.innerHTML = detailsHTML;

            const editFieldsHTML = details.map(detail => {
                return `
                    <div class="flex items-center">
                        <label class="w-1/4 text-right mr-4" for="${detail.activity}">${detail.activity}:</label>
                        <input id="${detail.activity}" name="${detail.activity}" type="number" value="${detail.rate}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                        <button type="button" class="ml-2 bg-red-500 text-white px-2 py-1 rounded-md delete-btn" data-activity="${detail.activity}">×</button>
                    </div>
                `;
            }).join('');
            editFieldsDiv.innerHTML = editFieldsHTML;

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const activityName = e.target.getAttribute('data-activity');
                    activitiesToDelete.push(activityName);
                    e.target.closest('div').remove();
                });
            });

            document.getElementById('edit-btn').addEventListener('click', () => {
                regionDetailsDiv.classList.add('hidden');
                editForm.classList.remove('hidden');
                addActivityForm.classList.remove('hidden');
                newActivitiesDiv.classList.remove('hidden');
            });

            document.getElementById('cancel-btn').addEventListener('click', () => {
                regionDetailsDiv.classList.remove('hidden');
                editForm.classList.add('hidden');
                addActivityForm.classList.add('hidden');
                newActivitiesDiv.classList.add('hidden');
                activitiesToDelete = [];
                activitiesToAdd = [];
                newActivitiesListDiv.innerHTML = '';
            });

            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const updates = Array.from(editForm.elements)
                    .filter(el => el.tagName === 'INPUT')
                    .map(input => ({ activity: input.name, rate: input.value }));

                await fetch(`/regions/${regionId}/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates })
                });

                await Promise.all(activitiesToDelete.map(activity => {
                    return fetch(`/regions/${regionId}/delete-activity`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ activity })
                    });
                }));

                await Promise.all(activitiesToAdd.map(activity => {
                    return fetch(`/regions/${regionId}/add-activity`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(activity)
                    });
                }));

                location.reload();
            });

            newActivityBtn.addEventListener('click', () => {
                const newActivity = document.getElementById('new-activity').value;
                const newRate = document.getElementById('new-rate').value;

                const existingActivities = details.map(detail => detail.activity.toLowerCase());
                const newActivitiesNames = activitiesToAdd.map(activity => activity.activity.toLowerCase());
                if (existingActivities.includes(newActivity.toLowerCase()) || newActivitiesNames.includes(newActivity.toLowerCase())) {
                    activityWarning.classList.remove('hidden');
                } else {
                    activityWarning.classList.add('hidden');
                    activitiesToAdd.push({ activity: newActivity, rate: newRate });

                    const newActivityHTML = `
                        <div class="flex items-center">
                            <p class="w-1/4 text-right mr-4">${newActivity}:</p>
                            <p class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">${newRate}</p>
                        </div>
                    `;
                    newActivitiesListDiv.innerHTML += newActivityHTML;
                }
            });

            const activitiesResponse = await fetch('/activities');
            const activities = await activitiesResponse.json();
            const datalist = document.getElementById('activities-list');
            activities.forEach(activity => {
                const option = document.createElement('option');
                option.value = activity.name;
                datalist.appendChild(option);
            });

        } catch (error) {
            console.error('Error fetching region details:', error);
        }
    } else {
        console.error('No region ID provided in the URL');
    }
});
