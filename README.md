# Portfolio Visualizer

A React TypeScript web application for tracking and visualizing stock portfolio performance. The app allows users to add stock positions and view real-time updates of their portfolio value and performance.

## Features

- Add and remove stock positions with ticker symbol, number of shares, and purchase price
- Real-time stock price updates using Alpha Vantage API
- Visual representation of portfolio allocation using a treemap
- Gain/loss tracking for each position
- Responsive design for desktop and mobile

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Alpha Vantage API key (get one at https://www.alphavantage.co/support/#api-key)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your Alpha Vantage API key:
   ```
   VITE_ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Enter a stock ticker symbol (e.g., AAPL, GOOGL)
2. Specify the number of shares
3. Enter the purchase price per share
4. Click "Add" to add the position to your portfolio
5. View real-time updates of your portfolio's performance
6. Remove positions using the delete button

## Technologies Used

- React
- TypeScript
- Vite
- Material-UI
- Recharts
- Alpha Vantage API
- Axios

## License

MIT
