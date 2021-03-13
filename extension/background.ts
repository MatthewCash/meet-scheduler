(() => {
    chrome.runtime.onInstalled.addListener(details => {
        if (details.reason !== 'install') {
            chrome.storage.sync.set({ volume: 1 });
        }
        chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
            chrome.declarativeContent.onPageChanged.addRules([
                {
                    conditions: [
                        new chrome.declarativeContent.PageStateMatcher({
                            pageUrl: { hostEquals: 'meet.google.com' }
                        })
                    ],
                    actions: [new chrome.declarativeContent.ShowPageAction()]
                }
            ]);
        });
    });

    chrome.runtime.onMessage.addListener((req, sender, res) => {
        if (req.type === 'meet-notification') {
            const id = req.options.id;
            const userCount = req.options.userCount;

            chrome.windows.update(sender.tab.windowId, {
                drawAttention: true
            });

            chrome.notifications.create({
                type: 'basic',
                title: 'Meeting Ready',
                message: `There ${
                    userCount === 1 ? 'is' : 'are'
                } ${userCount} ${
                    userCount === 1 ? 'person' : 'people'
                } in your meet`,
                iconUrl: 'icons/meet.png',
                buttons: [
                    {
                        title: 'Join Meet'
                    }
                ]
            });

            chrome.notifications.onClicked.addListener(() => {
                chrome.tabs.highlight({ tabs: sender.tab.index });
            });

            chrome.notifications.onButtonClicked.addListener(() => {
                chrome.tabs.sendMessage(sender.tab.id, {
                    type: 'join-meet',
                    options: { id }
                });
            });
        }
    });

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
    let authUser = 0;

    chrome.storage.sync.get(['weekSchedule', 'authUser'], res => {
        weekSchedule = res.weekSchedule ?? weekSchedule;
        authUser = res.authUser ?? 0;
    });

    chrome.storage.onChanged.addListener(changes => {
        if (changes['weekSchedule']) {
            weekSchedule = changes['weekSchedule'].newValue;
        }
        if (changes['authUser']) authUser = changes['authUser'].newValue;
    });

    const startScheduler = async () => {
        const date = new Date();

        const delay = 60000 - date.getSeconds() * 1000 - date.getMilliseconds();

        await new Promise(r => setTimeout(r, delay));

        setInterval(() => {
            console.log('Checking schedule');
            const date = new Date();

            const formattedHours = String(date.getHours()).padStart(2, '0');
            const formattedMinutes = String(date.getMinutes()).padStart(2, '0');

            const formattedTime = `${formattedHours}:${formattedMinutes}`;

            const triggeredMeets = weekSchedule[new Date().getDay()].filter(
                meet => meet.time === formattedTime
            );

            triggeredMeets.forEach(({ code }) => {
                chrome.tabs.create({
                    url: `https://meet.google.com/lookup/${code}?authuser=${authUser}&autoRefresh=1&scheduled=1`
                });
            });
        }, 60000);
    };

    startScheduler();
})();
