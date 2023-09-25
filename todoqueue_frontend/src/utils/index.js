import moment from 'moment';

export const formatDuration = (duration) => {
    console.log("Formatting duration: ", duration);
    if (!duration) {
        return "Never";
    }

    // The day number may or may not exist, so handle that
    let days = "0";
    let time = duration;

    // Check if duration contains day information
    if (duration.includes(" ")) {
        const parts = duration.split(" ");
        days = parts[0];
        time = parts[1];
    }

    // Extract hours, minutes, and seconds
    const [hours, minutes, seconds] = time.split(":").map(Number);

    // Construct human-readable string
    const daysStr = days === "1" ? "1 day" : `${days} days`;
    const hoursStr = hours === 1 ? "1 hour" : `${hours} hours`;
    const minutesStr = minutes === 1 ? "1 minute" : `${minutes} minutes`;

    return `${daysStr} ${hoursStr} ${minutesStr}`;
};


export const getTimeSince = (timestamp) => {
    const now = moment();
    const then = moment(timestamp);
    const duration = moment.duration(now.diff(then));

    // If the duration is less than a minute, return "Just now"
    if (duration.asMinutes() < 1) {
        return "Just now";
    }

    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();

    let output = ''
    if (days !== 0) {
        output += days === "1" ? "1 day" : `${days} days`;
    }
    if (hours !== 0) {
        output += hours === 1 ? " 1 hour" : ` ${hours} hours`;
    }
    if (minutes !== 0) {
        output += minutes === 1 ? " 1 minute" : ` ${minutes} minutes`;
    }

    if (output === '') {
        return "Just now";
    }

    // If there's a trailing or leading space, remove it
    output = output.trim();

    output += " ago";

    return output;
};
