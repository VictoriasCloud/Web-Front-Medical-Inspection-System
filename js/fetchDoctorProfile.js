async function fetchDoctorProfile(apiBaseUrl, authToken) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/doctor/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке профиля доктора:', error);
        throw error;
    }
}
window.fetchDoctorProfile = fetchDoctorProfile;