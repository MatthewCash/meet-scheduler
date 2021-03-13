const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

type WeekSchedule = [
    ScheduledMeet[],
    ScheduledMeet[],
    ScheduledMeet[],
    ScheduledMeet[],
    ScheduledMeet[],
    ScheduledMeet[],
    ScheduledMeet[]
];

interface ScheduledMeet {
    code: string;
    time: string;
}

let weekSchedule: WeekSchedule = [[], [], [], [], [], [], []];

enum MinimumAction {
    NONE,
    NOTIFY,
    JOIN
}

let minimumCountToJoin = 1;
let autoMute = false;
let autoDisableCamera = false;
let authUser = 0;
let minimumAction: MinimumAction = MinimumAction.NOTIFY;

let viewedDay = new Date().getDay();

document.querySelector<HTMLDivElement>('#day-label').innerText =
    days[viewedDay];

chrome.storage.sync.get(
    [
        'weekSchedule',
        'minimumCountToJoin',
        'minimumAction',
        'autoMute',
        'autoDisableCamera',
        'authUser',
        ''
    ],
    res => {
        weekSchedule = res.weekSchedule ?? weekSchedule;
        renderScheduledMeets(viewedDay);

        minimumCountToJoin = res.minimumCountToJoin ?? 1;
        minimumAction = res.minimumAction ?? minimumAction;
        autoMute = res.autoMute ?? false;
        autoDisableCamera = res.autoDisableCamera ?? false;
        authUser = res.authUser ?? 0;
        renderSettings();
    }
);

const saveScheduledMeets = () => {
    chrome.storage.sync.set({ weekSchedule });
};

const saveSettings = () => {
    chrome.storage.sync.set({
        minimumCountToJoin,
        minimumAction,
        autoMute,
        autoDisableCamera,
        authUser
    });
};

const removeScheduledMeet = (day: number, code: string) => {
    const meetIndex = weekSchedule[day].findIndex(meet => meet.code === code);
    weekSchedule[day].splice(meetIndex, 1);
    saveScheduledMeets();
};

const addScheduledMeet = (day: number, code: string, time = '00:00') => {
    if (!code) throw new Error('No code provided!');
    const existingMeet = weekSchedule[day].find(meet => meet.code === code);
    if (existingMeet) throw new Error('That meet is already scheduled!');

    const newMeet: ScheduledMeet = {
        code,
        time
    };
    weekSchedule[day].push(newMeet);
    saveScheduledMeets();
};

const editMeetTime = (day: number, code: string, time: string) => {
    const scheduledMeet = weekSchedule[day].find(meet => meet.code === code);
    scheduledMeet.time = time;
    saveScheduledMeets();
};

const renderScheduledMeets = (day: number) => {
    const meetsContainer = document.querySelector('#meets');
    meetsContainer.textContent = '';

    weekSchedule[day].forEach(scheduledMeet => {
        const meetContainer = document.createElement('tr');
        meetContainer.classList.add('meet-container');

        const meetLabel = document.createElement('th');
        meetLabel.classList.add('meet-label');
        meetLabel.innerText = scheduledMeet.code;

        const meetInputTableItem = document.createElement('th');

        const meetInput = document.createElement('input');
        meetInput.classList.add('meet-input');
        meetInput.type = 'time';
        meetInput.value = scheduledMeet.time;
        meetInput.addEventListener('input', event => {
            const time = (event.currentTarget as HTMLInputElement).value;
            editMeetTime(viewedDay, scheduledMeet.code, time);
            renderScheduledMeets(viewedDay);
        });

        meetInputTableItem.appendChild(meetInput);

        const removeMeetButton = document.createElement('button');
        removeMeetButton.innerText = 'x';
        removeMeetButton.classList.add('remove-meet');
        removeMeetButton.addEventListener('click', event => {
            removeScheduledMeet(viewedDay, scheduledMeet.code);
            renderScheduledMeets(viewedDay);
        });

        meetInputTableItem.appendChild(removeMeetButton);

        meetContainer.appendChild(meetLabel);
        meetContainer.appendChild(meetInputTableItem);

        meetsContainer.appendChild(meetContainer);
    });
};

const renderSettings = () => {
    document.querySelector<HTMLInputElement>(
        '#minimum-user-input'
    ).value = String(minimumCountToJoin);
    document.querySelector<HTMLSelectElement>(
        '#minimum-action-input'
    ).value = String(minimumAction);
    document.querySelector<HTMLInputElement>(
        '#auto-mute-input'
    ).checked = autoMute;
    document.querySelector<HTMLInputElement>(
        '#auto-disable-camera-input'
    ).checked = autoDisableCamera;
    document.querySelector<HTMLInputElement>('#auth-user-input').value = String(
        authUser
    );
};

const createMeetButton = document.querySelector(
    '#create-meet'
) as HTMLButtonElement;
const createMeetCodeInput = document.querySelector(
    '#input-code'
) as HTMLInputElement;

createMeetButton.addEventListener('click', event => {
    addScheduledMeet(viewedDay, createMeetCodeInput.value);

    renderScheduledMeets(viewedDay);

    createMeetCodeInput.value = '';
});

const minimumUserInput = document.querySelector<HTMLInputElement>(
    '#minimum-user-input'
);
minimumUserInput.addEventListener('input', () => {
    minimumCountToJoin = Number(minimumUserInput.value);
    saveSettings();
});

const minimumActionInput = document.querySelector<HTMLInputElement>(
    '#minimum-action-input'
);
minimumActionInput.addEventListener('input', () => {
    minimumAction = Number(minimumActionInput.value);
    saveSettings();
});

const autoMuteInput = document.querySelector<HTMLInputElement>(
    '#auto-mute-input'
);
autoMuteInput.addEventListener('input', () => {
    autoMute = autoMuteInput.checked;
    saveSettings();
});

const autoDisableCameraInput = document.querySelector<HTMLInputElement>(
    '#auto-disable-camera-input'
);
autoDisableCameraInput.addEventListener('input', () => {
    console.log('update to', autoDisableCameraInput.checked);
    autoDisableCamera = autoDisableCameraInput.checked;
    saveSettings();
});

const authUserInput = document.querySelector<HTMLInputElement>(
    '#auth-user-input'
);
authUserInput.addEventListener('input', () => {
    authUser = Number(authUserInput.value);
    saveSettings();
});

// Pagination

document
    .querySelector<HTMLButtonElement>('#prev-day')
    .addEventListener('click', () => {
        viewedDay--;
        if (viewedDay < 0) viewedDay = 6;

        renderScheduledMeets(viewedDay);

        document.querySelector<HTMLDivElement>('#day-label').innerText =
            days[viewedDay];
    });

document
    .querySelector<HTMLButtonElement>('#next-day')
    .addEventListener('click', () => {
        viewedDay++;
        if (viewedDay > 6) viewedDay = 0;

        renderScheduledMeets(viewedDay);

        document.querySelector<HTMLDivElement>('#day-label').innerText =
            days[viewedDay];
    });
