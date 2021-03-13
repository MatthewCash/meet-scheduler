(() => {
    enum MinimumAction {
        NONE,
        NOTIFY,
        JOIN
    }

    let minimumCountToJoin = 1;
    let minimumAction: MinimumAction = MinimumAction.NOTIFY;
    let autoMute = false;
    let autoDisableCamera = false;

    chrome.storage.sync.get(
        [
            'minimumCountToJoin',
            'minimumAction',
            'autoMute',
            'autoDisableCamera'
        ],
        res => {
            minimumCountToJoin = res.minimumCountToJoin ?? 1;
            minimumAction = res.minimumAction ?? minimumAction;
            autoMute = res.autoMute ?? false;
            autoDisableCamera = res.autoDisableCamera ?? false;
        }
    );

    chrome.storage.onChanged.addListener(changes => {
        if (changes['minimumCountToJoin']) {
            minimumCountToJoin = changes['minimumCountToJoin'].newValue;
        }
        if (changes['minimumAction']) {
            minimumCountToJoin = changes['minimumAction'].newValue;
        }
    });

    const reload = () => location.reload();

    const checkForReloadCondition = () => {
        // You can't create a meeting
        const noMeeting = Boolean(
            Array.from(document.querySelectorAll<HTMLDivElement>('*')).find(
                el =>
                    el?.innerText ===
                    "You can't create a meeting yourself. Contact your system administrator for more information."
            )
        );

        // Meeting hasn't started yet
        const tooEarly = Boolean(
            Array.from(document.querySelectorAll<HTMLDivElement>('*')).find(
                el => el?.innerText === "This meeting hasn't started yet"
            )
        );

        if (noMeeting || tooEarly) {
            reload();
        }
    };

    const getUserCount = (): number => {
        let count = 0;

        const userIconContainer = document.querySelector(
            '#yDmH0d > c-wiz > div > div > div:nth-child(9) > div.crqnQb > div > div > div.vgJExf > div > div.KieQAe > div.d7iDfe.NONs6c > div > div.qIHHZb > div.pI48Vc.wdtZof > div.ecVYYe > div.U04fid'
        );

        if (!userIconContainer) return null;

        const userIcons = document.querySelectorAll(
            '#yDmH0d > c-wiz > div > div > div:nth-child(9) > div.crqnQb > div > div > div.vgJExf > div > div.KieQAe > div.d7iDfe.NONs6c > div > div.qIHHZb > div.pI48Vc.wdtZof > div.ecVYYe > div.U04fid > img'
        );
        count += userIcons.length;

        const plusMore = document.querySelector(
            '#yDmH0d > c-wiz > div > div > div:nth-child(9) > div.crqnQb > div > div > div.vgJExf > div > div.KieQAe > div.d7iDfe.NONs6c > div > div.qIHHZb > div.pI48Vc.wdtZof > div.ecVYYe > div.U04fid > div'
        );

        const plusMoreCount = Number(plusMore?.textContent);

        if (!isNaN(plusMoreCount)) count += plusMoreCount;

        return count;
    };

    const autoReload = window.location.search.includes('autoRefresh=1');
    const scheduled = window.location.search.includes('scheduled=1');

    if (autoReload) checkForReloadCondition();

    const checkUserCountInterval = setInterval(async () => {
        if (autoReload) checkForReloadCondition();
        const userCount = getUserCount();

        if (userCount == null) return;

        if (!meetLoaded) onMeetLoad();

        if (userCount < minimumCountToJoin) {
            if (autoReload) reload();
            return;
        }

        onMeetReady(userCount);
    }, 1000);

    let meetLoaded = false;
    const onMeetLoad = () => {
        meetLoaded = true;

        if (autoMute) {
            document
                .querySelector<HTMLDivElement>(
                    '#yDmH0d > c-wiz > div > div > div:nth-child(9) > div.crqnQb > div > div > div.vgJExf > div > div.KieQAe > div.ZUpb4c > div.oORaUb.NONs6c > div > div.EhAUAc > div.ZB88ed > div > div > div[data-is-muted="false"]'
                )
                ?.click();
        }

        if (autoDisableCamera) {
            document
                .querySelector<HTMLDivElement>(
                    '#yDmH0d > c-wiz > div > div > div:nth-child(9) > div.crqnQb > div > div > div.vgJExf > div > div.KieQAe > div.ZUpb4c > div.oORaUb.NONs6c > div > div.EhAUAc > div.GOH7Zb > div > div[data-is-muted="false"]'
                )
                ?.click();
        }
    };

    const onMeetReady = (userCount: number) => {
        clearInterval(checkUserCountInterval);

        if (minimumAction === MinimumAction.NONE || !scheduled) return;

        if (minimumAction === MinimumAction.JOIN) return joinMeet();

        const id = Math.random();

        chrome.runtime.onMessage.addListener((req, sender, res) => {
            if (req.type !== 'join-meet') return;
            if (req.options.id !== id) return;

            joinMeet();
        });

        chrome.runtime.sendMessage({
            type: 'meet-notification',
            options: {
                userCount,
                id
            }
        });
    };

    const joinMeet = () => {
        const joinButton = Array.from(document.querySelectorAll('span')).find(
            el => el.innerText === 'Join now'
        ).parentElement as HTMLDivElement;

        joinButton?.click();
    };
})();
