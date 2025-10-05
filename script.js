document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const state = {
        todayData: {
            meals: [],
            totals: { calories: 0, carbs: 0, protein: 0, fat: 0 },
            proteinGoal: 0,
            calorieGoal: 0
        },
        currentFoodsBreakdown: []
    };

    // DOM Elements
    const getEl = (id) => document.getElementById(id);
    const currentDateEl = getEl('current-date');
    const totalCaloriesEl = getEl('total-calories');
    const totalCarbsEl = getEl('total-carbs');
    const totalProteinEl = getEl('total-protein');
    const totalFatEl = getEl('total-fat');
    const mealsListEl = getEl('meals-list');
    const emptyStateEl = getEl('empty-state');
    const proteinGoalEl = getEl('protein-goal');
    const proteinProgressEl = getEl('protein-progress');
    const proteinStatusEl = getEl('protein-status');
    const badgeEl = getEl('badge');
    const calorieGoalEl = getEl('calorie-goal');
    const calorieProgressEl = getEl('calorie-progress');
    const calorieStatusEl = getEl('calorie-status');
    const calorieBadgeEl = getEl('calorie-badge');
    
    // Modal Elements
    const addMealBtn = getEl('add-meal-btn');
    const mealModal = getEl('meal-modal');
    const closeModalBtn = getEl('close-modal-btn');
    const cancelBtn = getEl('cancel-btn');
    const mealForm = getEl('meal-form');
    const mealDescription = getEl('meal-description');
    const calculateBtn = getEl('calculate-btn');
    const loader = getEl('loader');
    const errorMessage = getEl('error-message');
    const resultsContainer = getEl('results-container');
    const submitMealBtn = getEl('submit-meal-btn');

    // Modal Toggles & State Reset
    const openModal = () => {
        mealModal.classList.remove('hidden');
        setTimeout(() => {
            mealModal.classList.remove('opacity-0');
            mealModal.querySelector('.modal-content').classList.remove('-translate-y-10');
        }, 10);
        mealForm.reset();
        submitMealBtn.disabled = true;
        calculateBtn.disabled = true;
        calculateBtn.classList.remove('hidden');
        loader.classList.add('hidden');
        errorMessage.classList.add('hidden');
        resultsContainer.classList.add('hidden', 'opacity-0');
    };

    const closeModal = () => {
        mealModal.classList.add('opacity-0');
        mealModal.querySelector('.modal-content').classList.add('-translate-y-10');
        setTimeout(() => {
            mealModal.classList.add('hidden');
            mealForm.reset();
        }, 250);
    };

    addMealBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // App Logic
    const getTodayDateString = () => new Date().toISOString().split('T')[0];
    const getFormattedDate = () => new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const saveData = () => {
        try {
            localStorage.setItem(getTodayDateString(), JSON.stringify(state.todayData));
        } catch (e) {
            console.error("Error saving to localStorage", e);
        }
    };

    const loadData = () => {
        try {
            const data = localStorage.getItem(getTodayDateString());
            if (data) state.todayData = JSON.parse(data);
        } catch (e) {
            console.error("Error loading from localStorage", e);
        }
    };

    const calculateTotals = () => {
        const totals = { calories: 0, carbs: 0, protein: 0, fat: 0 };
        state.todayData.meals.forEach(meal => {
            totals.calories += meal.calories;
            totals.carbs += meal.carbs;
            totals.protein += meal.protein;
            totals.fat += meal.fat;
        });
        state.todayData.totals = totals;
        updateGoalProgress();
    };
    
    const updateGoalProgress = () => {
        const { totals, proteinGoal, calorieGoal } = state.todayData;

        // Protein Goal
        const proteinCurrent = totals.protein || 0;
        const proteinProgressPercent = proteinGoal > 0 ? Math.min(100, (proteinCurrent / proteinGoal) * 100) : 0;
        proteinProgressEl.style.width = `${proteinProgressPercent}%`;
        proteinStatusEl.textContent = `${proteinCurrent} / ${proteinGoal || 0} g`;
        badgeEl.classList.toggle('opacity-0', !(proteinGoal > 0 && proteinCurrent >= proteinGoal));

        // Calorie Goal
        const calorieCurrent = totals.calories || 0;
        const calorieProgressPercent = calorieGoal > 0 ? Math.min(100, (calorieCurrent / calorieGoal) * 100) : 0;
        calorieProgressEl.style.width = `${calorieProgressPercent}%`;
        calorieStatusEl.textContent = `${calorieCurrent} / ${calorieGoal || 0} kcal`;
        calorieBadgeEl.classList.toggle('opacity-0', !(calorieGoal > 0 && calorieCurrent >= calorieGoal));
    };

    const getIconForMeal = (mealType) => ({
        'breakfast': 'coffee',
        'lunch': 'sandwich',
        'dinner': 'utensils-crossed',
        'snack': 'cookie'
    })[mealType.toLowerCase()] || 'egg-fried';

    const render = () => {
        totalCaloriesEl.textContent = state.todayData.totals.calories;
        totalCarbsEl.textContent = state.todayData.totals.carbs;
        totalProteinEl.textContent = state.todayData.totals.protein;
        totalFatEl.textContent = state.todayData.totals.fat;

        mealsListEl.innerHTML = '';
        if (state.todayData.meals.length === 0) {
            mealsListEl.appendChild(emptyStateEl);
        } else {
            state.todayData.meals.forEach(meal => {
                const mealCard = document.createElement('div');
                mealCard.className = 'bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col space-y-2';
                const foodsHtml = meal.foods && meal.foods.length > 0 ? `
                    <details class="text-xs text-gray-600 border-t border-gray-200 pt-2">
                        <summary class="font-semibold cursor-pointer">Food Breakdown</summary>
                        <ul class="list-disc list-inside max-h-32 overflow-y-auto mt-1">
                            ${meal.foods.map(food => `<li><span class="font-medium">${food.name}</span> - Cal: ${food.calories}, P: ${food.protein}g, C: ${food.carbs}g, F: ${food.fat}g</li>`).join('')}
                        </ul>
                    </details>` : '';
                
                mealCard.innerHTML = `
                    <div class="flex items-start space-x-4">
                        <div class="bg-indigo-100 text-indigo-600 rounded-lg p-3">
                            <i data-lucide="${getIconForMeal(meal.type)}" class="w-6 h-6"></i>
                        </div>
                        <div class="flex-grow">
                            <div class="flex justify-between items-center">
                                <h3 class="font-bold text-lg">${meal.name}</h3>
                                <p class="text-sm font-semibold text-indigo-600">${meal.calories} kcal</p>
                            </div>
                            <p class="text-sm text-gray-500 mb-2">${meal.type}</p>
                            <div class="text-xs text-gray-600 grid grid-cols-3 gap-x-2">
                                <span>Carbs: ${meal.carbs}g</span>
                                <span>Protein: ${meal.protein}g</span>
                                <span>Fat: ${meal.fat}g</span>
                            </div>
                        </div>
                        <button class="delete-meal-btn text-gray-400 hover:text-red-500 flex-shrink-0" data-id="${meal.id}">
                            <i data-lucide="trash-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                    ${foodsHtml}`;
                mealsListEl.appendChild(mealCard);
            });
        }
        lucide.createIcons();
    };

    const handleCalculation = async () => {
        const description = mealDescription.value;
        if (!description.trim()) return;

        loader.classList.remove('hidden');
        calculateBtn.classList.add('hidden');
        errorMessage.classList.add('hidden');
        resultsContainer.classList.add('hidden', 'opacity-0');
        submitMealBtn.disabled = true;

        for (let i = 0; i < 3; i++) {
            try {
                const systemPrompt = "You are a nutrition calculator. Given a description of a meal, identify the individual food items mentioned and calculate the estimated calories, protein, carbs, and fat for each item, as well as the totals for the entire meal. Respond only with a single, valid JSON object with two keys: 'totals' (an object with 'calories', 'protein', 'carbs', 'fat') and 'foods' (an array of objects, each with 'name', 'calories', 'protein', 'carbs', 'fat'). All numeric values should be rounded to the nearest whole number. Do not include units, notes, or any other text in your response. Example format: {\"totals\": {\"calories\": 500, \"protein\": 30, \"carbs\": 55, \"fat\": 20}, \"foods\": [{\"name\": \"3 eggs\", \"calories\": 210, \"protein\": 18, \"carbs\": 1, \"fat\": 15}, {\"name\": \"40gm oats\", \"calories\": 150, \"protein\": 5, \"carbs\": 27, \"fat\": 3}]}";
                const apiKey = "AIzaSyC9okQwAifMuLO-8xDC_0FH5FMo9elTDU8";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: description }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                    })
                });

                if (!response.ok) throw new Error(`API error: ${response.status}`);
                
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("Invalid response from API.");

                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const nutritionData = JSON.parse(cleanedText);

                getEl('calories').value = nutritionData.totals.calories || 0;
                getEl('protein').value = nutritionData.totals.protein || 0;
                getEl('carbs').value = nutritionData.totals.carbs || 0;
                getEl('fat').value = nutritionData.totals.fat || 0;

                state.currentFoodsBreakdown = nutritionData.foods || [];

                resultsContainer.classList.remove('hidden');
                setTimeout(() => resultsContainer.classList.remove('opacity-0'), 10);
                submitMealBtn.disabled = false;
                
                loader.classList.add('hidden');
                calculateBtn.classList.remove('hidden');
                return;

            } catch (error) {
                console.error(`Attempt ${i + 1} failed:`, error);
                if (i === 2) {
                    errorMessage.textContent = 'Failed to calculate. Please enter manually.';
                    errorMessage.classList.remove('hidden');
                    loader.classList.add('hidden');
                    calculateBtn.classList.remove('hidden');
                } else {
                   await new Promise(res => setTimeout(res, 1000 * (i + 1)));
                }
            }
        }
    };

    mealDescription.addEventListener('input', () => {
        calculateBtn.disabled = !mealDescription.value.trim();
        if(!resultsContainer.classList.contains('hidden')){
            resultsContainer.classList.add('opacity-0');
            setTimeout(() => resultsContainer.classList.add('hidden'), 300);
        }
        submitMealBtn.disabled = true;
    });
    
    calculateBtn.addEventListener('click', handleCalculation);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const meal = {
            id: Date.now(),
            name: getEl('meal-name').value,
            type: getEl('meal-type').value,
            calories: parseInt(getEl('calories').value) || 0,
            carbs: parseInt(getEl('carbs').value) || 0,
            protein: parseInt(getEl('protein').value) || 0,
            fat: parseInt(getEl('fat').value) || 0,
            foods: state.currentFoodsBreakdown || []
        };
        
        state.todayData.meals.push(meal);
        calculateTotals();
        saveData();
        render();
        closeModal();
    };

    const deleteMeal = (id) => {
        state.todayData.meals = state.todayData.meals.filter(meal => meal.id !== id);
        calculateTotals();
        saveData();
        render();
    };

    mealsListEl.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-meal-btn');
        if (deleteButton) {
            deleteMeal(parseInt(deleteButton.dataset.id));
        }
    });

    mealForm.addEventListener('submit', handleFormSubmit);
    
    proteinGoalEl.addEventListener('input', () => {
        state.todayData.proteinGoal = parseInt(proteinGoalEl.value) || 0;
        updateGoalProgress();
        saveData();
    });
    
    calorieGoalEl.addEventListener('input', () => {
        state.todayData.calorieGoal = parseInt(calorieGoalEl.value) || 0;
        updateGoalProgress();
        saveData();
    });

    // Dark Mode Toggle
    const darkModeToggle = getEl('dark-mode-toggle');
    const darkModeIcon = getEl('dark-mode-icon');
    const body = document.body;
    const savedMode = localStorage.getItem('color-mode');
    
    if (savedMode === 'dark') {
        body.classList.add('dark');
        darkModeIcon.setAttribute('data-lucide', 'sun');
    } else {
        darkModeIcon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        if (body.classList.contains('dark')) {
            darkModeIcon.setAttribute('data-lucide', 'sun');
            localStorage.setItem('color-mode', 'dark');
        } else {
            darkModeIcon.setAttribute('data-lucide', 'moon');
            localStorage.setItem('color-mode', 'light');
        }
        lucide.createIcons();
    });

    // Reset Button
    const resetBtn = getEl('reset-btn');
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the tracker? This will clear all data.')) {
            localStorage.removeItem(getTodayDateString());
            state.todayData = {
                meals: [],
                totals: { calories: 0, carbs: 0, protein: 0, fat: 0 },
                proteinGoal: 0,
                calorieGoal: 0
            };
            render();
            updateGoalProgress();
        }
    });

    const init = () => {
        currentDateEl.textContent = getFormattedDate();
        loadData();
        proteinGoalEl.value = state.todayData.proteinGoal || '';
        calorieGoalEl.value = state.todayData.calorieGoal || '';
        calculateTotals();
        render();
    };

    init();
});
