import React, { useEffect, useState, useCallback } from "react";
import { Card, Row } from "antd";
import { Line, Pie } from "@ant-design/charts";
import moment from "moment";
import TransactionSearch from "./TransactionSearch";
import Header from "./Header";
import AddIncomeModal from "./Modals/AddIncome";
import AddExpenseModal from "./Modals/AddExpense";
import Cards from "./Cards";
import NoTransactions from "./NoTransactions";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import Loader from "./Loader";
import { toast } from "react-toastify";
import { unparse } from "papaparse";

const Dashboard = () => {
  const [user] = useAuthState(auth);

  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  // Process data for charts
  const processChartData = () => {
    const balanceData = [];
    const spendingData = {};

    transactions.forEach((transaction) => {
      const monthYear = moment(transaction.date).format("MMM YYYY");
      const tag = transaction.tag;

      if (transaction.type === "income") {
        if (balanceData.some((data) => data.month === monthYear)) {
          balanceData.find((data) => data.month === monthYear).balance +=
            transaction.amount;
        } else {
          balanceData.push({ month: monthYear, balance: transaction.amount });
        }
      } else {
        if (balanceData.some((data) => data.month === monthYear)) {
          balanceData.find((data) => data.month === monthYear).balance -=
            transaction.amount;
        } else {
          balanceData.push({ month: monthYear, balance: -transaction.amount });
        }

        if (spendingData[tag]) {
          spendingData[tag] += transaction.amount;
        } else {
          spendingData[tag] = transaction.amount;
        }
      }
    });

    const spendingDataArray = Object.keys(spendingData).map((key) => ({
      category: key,
      value: spendingData[key],
    }));

    return { balanceData, spendingDataArray };
  };

  const { balanceData, spendingDataArray } = processChartData();

  // Modal Handlers
  const showExpenseModal = () => setIsExpenseModalVisible(true);
  const showIncomeModal = () => setIsIncomeModalVisible(true);
  const handleExpenseCancel = () => setIsExpenseModalVisible(false);
  const handleIncomeCancel = () => setIsIncomeModalVisible(false);

  // Add new transaction
  const onFinish = (values, type) => {
    const newTransaction = {
      type: type,
      date: moment(values.date).format("YYYY-MM-DD"),
      amount: parseFloat(values.amount),
      tag: values.tag,
      name: values.name,
    };

    setTransactions([...transactions, newTransaction]);
    setIsExpenseModalVisible(false);
    setIsIncomeModalVisible(false);
    addTransaction(newTransaction);
    calculateBalance();
  };

  const calculateBalance = useCallback(() => {
    let incomeTotal = 0;
    let expensesTotal = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        incomeTotal += transaction.amount;
      } else {
        expensesTotal += transaction.amount;
      }
    });

    setIncome(incomeTotal);
    setExpenses(expensesTotal);
    setCurrentBalance(incomeTotal - expensesTotal);
  }, [transactions]);

  useEffect(() => {
    calculateBalance();
  }, [transactions, calculateBalance]);

  async function addTransaction(transaction, many) {
    try {
      const docRef = await addDoc(
        collection(db, `users/${user.uid}/transactions`),
        transaction
      );
      console.log("Document written with ID: ", docRef.id);
      if (!many) {
        toast.success("Transaction Added!");
      }
    } catch (e) {
      console.error("Error adding document: ", e);
      if (!many) {
        toast.error("Couldn't add transaction");
      }
    }
  }

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    if (user) {
      const q = query(collection(db, `users/${user.uid}/transactions`));
      const querySnapshot = await getDocs(q);
      let transactionsArray = [];
      querySnapshot.forEach((doc) => {
        transactionsArray.push(doc.data());
      });
      setTransactions(transactionsArray);
      toast.success("Transactions Fetched!");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const balanceConfig = {
    data: balanceData,
    xField: "month",
    yField: "balance",
  };

  const spendingConfig = {
    data: spendingDataArray,
    angleField: "value",
    colorField: "category",
  };

  function reset() {
    console.log("resetting");
  }

  const cardStyle = {
    boxShadow: "0px 0px 30px 8px rgba(227, 227, 227, 0.75)",
    margin: "2rem",
    borderRadius: "0.5rem",
    minWidth: "400px",
    flex: 1,
  };

  function exportToCsv() {
    const csv = unparse(transactions, {
      fields: ["name", "type", "date", "amount", "tag"],
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="dashboard-container">
      <Header />
      {loading ? (
        <Loader />
      ) : (
        <>
          <Cards
            currentBalance={currentBalance}
            income={income}
            expenses={expenses}
            showExpenseModal={showExpenseModal}
            showIncomeModal={showIncomeModal}
            cardStyle={cardStyle}
            reset={reset}
          />

          <AddExpenseModal
            isExpenseModalVisible={isExpenseModalVisible}
            handleExpenseCancel={handleExpenseCancel}
            onFinish={onFinish}
          />
          <AddIncomeModal
            isIncomeModalVisible={isIncomeModalVisible}
            handleIncomeCancel={handleIncomeCancel}
            onFinish={onFinish}
          />
          {transactions.length === 0 ? (
            <NoTransactions />
          ) : (
            <>
              <Row gutter={16}>
                <Card bordered={true} style={cardStyle}>
                  <h2>Financial Statistics</h2>
                  <Line {...{ ...balanceConfig, data: balanceData }} />
                </Card>

                <Card bordered={true} style={{ ...cardStyle, flex: 0.45 }}>
                  <h2>Total Spending</h2>
                  {spendingDataArray.length === 0 ? ( // fixed ===
                    <p>Seems like you haven't spent anything till now...</p>
                  ) : (
                    <Pie {...{ ...spendingConfig, data: spendingDataArray }} />
                  )}
                </Card>
              </Row>
            </>
          )}
          <TransactionSearch
            transactions={transactions}
            exportToCsv={exportToCsv}
            fetchTransactions={fetchTransactions}
            addTransaction={addTransaction}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
