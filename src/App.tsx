import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)

  /**
   * Transactions are either:
   *  1. paginated transactions if they exist
   *  2. transactions by employee if they exist
   *  3. null otherwise
   */
  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  /**
   * Load all transactions, useful when filter is "All Employees"
   */
  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    // Set all transactions by employee to null
    transactionsByEmployeeUtils.invalidateData()
    // Fetch all employees to populate the filter
    await employeeUtils.fetchAll()
    // Set loading to false, as we're done loading employees
    setIsLoading(false)
    // Fetch all transactions to populate the table
    await paginatedTransactionsUtils.fetchAll()
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  /**
   * Load transactions by employee, useful when filter is one of the employees
   * @param employeeId The employee id to load transactions for
   */
  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      // Set paginated transactions to null
      paginatedTransactionsUtils.invalidateData()
      // Fetch the transactions by employee
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  /*
   * Load all transactions on mount
   */
  useEffect(() => {
    // Only load all transactions if there are no employees and we're not loading
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />
        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            if (newValue.id === EMPTY_EMPLOYEE.id) {
              setCurrentEmployee(null)
              await loadAllTransactions()
              return
            }
            setCurrentEmployee(newValue)
            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                if (currentEmployee === null) {
                  await loadAllTransactions()
                  return
                }
                await loadTransactionsByEmployee(currentEmployee.id)
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
