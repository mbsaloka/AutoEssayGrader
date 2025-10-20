export const inputClasses =
    "w-full px-6 py-3 bg-white dark:bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors";
export const labelClasses =
    "block text-sm font-medium text-gray-900 dark:text-white mb-2";
export const errorClasses = "mt-2 text-sm text-red-600 dark:text-red-400";
export const containerClasses = "min-h-screen flex flex-col bg-[#2b2d31] dark:bg-[#2b2d31] bg-gray-50";
export const cardGradients = [
    "bg-gradient-to-br from-yellow-600 to-yellow-700",
    "bg-gradient-to-br from-blue-800 to-blue-900",
    "bg-gradient-to-br from-yellow-700 to-yellow-800",
    "bg-gradient-to-br from-blue-700 to-blue-800",
    "bg-gradient-to-br from-yellow-600 to-yellow-700",
    "bg-gradient-to-br from-blue-900 to-blue-950",
];
export const getCardColor = (index: number) => cardGradients[index % cardGradients.length];
export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
};
