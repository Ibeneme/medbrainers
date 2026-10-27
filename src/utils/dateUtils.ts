/** Formats date into "24th April 2026, Wednesday 09:43AM GMT +1" format */
export const formatRecordedDate = (dateString?: string | Date) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";

    const day = date.getDate();
    const getOrdinalSuffix = (d: number) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
            case 1:
                return "st";
            case 2:
                return "nd";
            case 3:
                return "rd";
            default:
                return "th";
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const weekdays = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    ];

    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const weekday = weekdays[date.getDay()];

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = hours.toString().padStart(2, "0");

    return `${day}${getOrdinalSuffix(day)} ${monthName} ${year}, ${weekday} ${formattedHours}:${minutes}${ampm} GMT +1`;
};