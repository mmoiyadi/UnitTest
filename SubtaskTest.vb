Imports System.Collections.Generic

Imports UIBusinessLayer.KanbanData

Imports Microsoft.VisualStudio.TestTools.UnitTesting

Imports UIBusinessLayer
Imports System.Windows.Forms

Public Class Main
    Public Shared Sub Main()
        Dim st As New SubtaskTest
        st.TestSubtaskCollectionWithNextCount1()
        st.TestSubtaskCollectionWithNextCount2()
    End Sub
End Class

'''<summary>
'''This is a test class for SubtaskTest and is intended
'''to contain all SubtaskTest Unit Tests
'''</summary>
<TestClass()>
Public Class SubtaskTest


    Private testContextInstance As TestContext



    '''<summary>
    '''Gets or sets the test context which provides
    '''information about and functionality for the current test run.
    '''</summary>
    Public Property TestContext() As TestContext
        Get
            Return testContextInstance
        End Get
        Set(value As TestContext)
            testContextInstance = value
        End Set
    End Property

#Region "Additional test attributes"
    '
    'You can use the following additional attributes as you write your tests:
    '
    'Use ClassInitialize to run code before running the first test in the class
    <ClassInitialize()>
    Public Shared Sub SubtaskInitialize(ByVal testContext As TestContext)

    End Sub
    '
    'Use ClassCleanup to run code after all tests in a class have run
    <ClassCleanup()>
    Public Shared Sub MyClassCleanup()
        'MessageBox.Show("Class Cleanup")
    End Sub
    '
    'Use TestInitialize to run code before running each test
    <TestInitialize()>
    Public Sub MyTestInitialize()
        'MessageBox.Show(" Test Initialize")

        ' Active subtask
        Dim subtask1 = New KanbanSubtaskPriorityInfo()
        subtask1.ProjectId = 1
        subtask1.SubtaskId = 1001
        subtask1.IsManuallyPrioritized = False


        Dim subtask2 = New KanbanSubtaskPriorityInfo()
        subtask2.ProjectId = 2
        subtask2.SubtaskId = 1001
        subtask2.IsManuallyPrioritized = True

        Dim subtask3 = New KanbanSubtaskPriorityInfo()
        subtask3.ProjectId = 3
        subtask3.SubtaskId = 1004
        subtask3.IsManuallyPrioritized = True

        Dim subtask4 = New KanbanSubtaskPriorityInfo()
        subtask4.ProjectId = 1
        subtask4.SubtaskId = 1002
        subtask4.IsManuallyPrioritized = True

        Dim subtask5 = New KanbanSubtaskPriorityInfo()
        subtask5.ProjectId = 3
        subtask5.SubtaskId = 1002
        subtask5.IsManuallyPrioritized = True

        ' Non active subtask
        Dim subtask6 = New KanbanSubtaskPriorityInfo()
        subtask6.ProjectId = 4
        subtask6.SubtaskId = 1002
        subtask6.IsManuallyPrioritized = True

        Dim subtask7 = New KanbanSubtaskPriorityInfo()
        subtask7.ProjectId = 5
        subtask7.SubtaskId = 1001
        subtask7.IsManuallyPrioritized = True

        subtaskVM.ActiveSubtasksPriority.Add(subtask1)
        subtaskVM.ActiveSubtasksPriority.Add(subtask2)
        subtaskVM.ActiveSubtasksPriority.Add(subtask3)
        subtaskVM.ActiveSubtasksPriority.Add(subtask4)
        subtaskVM.ActiveSubtasksPriority.Add(subtask5)

        subtaskVM.NonActiveSubtasksPriority.Add(subtask6)
        subtaskVM.NonActiveSubtasksPriority.Add(subtask7)
        ' Dim target As SubtaskPopulator = New SubtaskPopulator() ' TODO: Initialize to an appropriate value
        ' Dim subtaskVM As KanbanSubtaskPriorityViewModel = New KanbanSubtaskPriorityViewModel
    End Sub
    '
    'Use TestCleanup to run code after each test has run
    <TestCleanup()>
    Public Sub MyTestCleanup()
        'MessageBox.Show("Test Cleanup")
    End Sub
    '
#End Region
    Public target As SubtaskPopulator = New SubtaskPopulator()
    Public subtaskVM As KanbanSubtaskPriorityViewModel = New KanbanSubtaskPriorityViewModel

    '''<summary>
    '''A test for PopulateSubtaskPriorityInput
    '''</summary>
    <TestMethod()>
    Public Sub TestSubtaskCollectionWithNextCount1()
        'Dim target As SubtaskPopulator = New SubtaskPopulator() ' TODO: Initialize to an appropriate value
        'Dim subtaskVM As KanbanSubtaskPriorityViewModel = New KanbanSubtaskPriorityViewModel


        Dim status = New UpdateTaskListStatus
        Dim vInput As List(Of SubtaskPriorityData) = New List(Of SubtaskPriorityData) ' TODO: Initialize to an appropriate value
        Dim vInputExpected As List(Of SubtaskPriorityData) = Nothing ' TODO: Initialize to an appropriate value
        target.PopulateSubtaskPriorityInput(subtaskVM, 1, vInput)
        Assert.AreEqual(vInput.Count, 6, "Mismatch in size of output")

        Assert.AreEqual(vInput(0).ProjectId, 2, "Mismatch in first item (projid)")
        Assert.AreEqual(vInput(0).SubtaskId, 1001, "Mismatch in first item (task id)")
        Assert.AreEqual(vInput(0).NextTasks(0).ProjectId, 3, "Mismatch in first item (next task)")
        Assert.AreEqual(vInput(0).NextTasks(0).SubtaskId, 1004, "Mismatch in first item (next task)")
        Assert.AreEqual(vInput(0).NextTasks.Count, 1, "Mismatch in first item (next task)")
        'Assert.IsNull(vInput(0).NextTasks(1))


        Assert.AreEqual(vInput(1).ProjectId, 3)
        Assert.AreEqual(vInput(1).SubtaskId, 1004)
        Assert.AreEqual(vInput(1).NextTasks(0).ProjectId, 1)
        Assert.AreEqual(vInput(1).NextTasks(0).SubtaskId, 1002)
        Assert.AreEqual(vInput(1).NextTasks.Count, 1)

        Assert.AreEqual(vInput(2).ProjectId, 1)
        Assert.AreEqual(vInput(2).SubtaskId, 1002)
        Assert.AreEqual(vInput(2).NextTasks(0).ProjectId, 3)
        Assert.AreEqual(vInput(2).NextTasks(0).SubtaskId, 1002)
        Assert.AreEqual(vInput(2).NextTasks.Count, 1)

        Assert.AreEqual(vInput(3).ProjectId, 3)
        Assert.AreEqual(vInput(3).SubtaskId, 1002)
        Assert.AreEqual(vInput(3).NextTasks(0).ProjectId, -1)
        Assert.AreEqual(vInput(3).NextTasks(0).SubtaskId, -1)
        Assert.AreEqual(vInput(3).NextTasks.Count, 1)

        Assert.AreEqual(vInput(4).ProjectId, 4)
        Assert.AreEqual(vInput(4).SubtaskId, 1002)
        Assert.AreEqual(vInput(4).NextTasks(0).ProjectId, -1)
        Assert.AreEqual(vInput(4).NextTasks(0).SubtaskId, -1)
        Assert.AreEqual(vInput(4).NextTasks.Count, 1)

        Assert.AreEqual(vInput(5).ProjectId, 5)
        Assert.AreEqual(vInput(5).SubtaskId, 1001)
        Assert.AreEqual(vInput(5).NextTasks(0).ProjectId, -1)
        Assert.AreEqual(vInput(5).NextTasks(0).SubtaskId, -1)
        Assert.AreEqual(vInput(5).NextTasks.Count, 1)


    End Sub
    <TestMethod()>
    Public Sub TestSubtaskCollectionWithNextCount2()

        Dim status = New UpdateTaskListStatus
        Dim vInput As List(Of SubtaskPriorityData) = New List(Of SubtaskPriorityData) ' TODO: Initialize to an appropriate value
        Dim vInputExpected As List(Of SubtaskPriorityData) = Nothing ' TODO: Initialize to an appropriate value
        target.PopulateSubtaskPriorityInput(subtaskVM, 2, vInput)
        Assert.AreEqual(vInput.Count, 6, "Mismatch in size of output")
        Assert.AreEqual(vInput(0).ProjectId, 2)
        Assert.AreEqual(vInput(0).SubtaskId, 1001)
        Assert.AreEqual(vInput(0).NextTasks(0).ProjectId, 3)
        Assert.AreEqual(vInput(0).NextTasks(0).SubtaskId, 1004)
        Assert.AreEqual(vInput(0).NextTasks.Count, 2)
        'Assert.IsNull(vInput(0).NextTasks(1))

        Assert.AreEqual(vInput(1).ProjectId, 3)
        Assert.AreEqual(vInput(1).SubtaskId, 1004)
        Assert.AreEqual(vInput(1).NextTasks(0).ProjectId, 1)
        Assert.AreEqual(vInput(1).NextTasks(0).SubtaskId, 1002)
        Assert.AreEqual(vInput(1).NextTasks.Count, 2)

        Assert.AreEqual(vInput(2).ProjectId, 1)
        Assert.AreEqual(vInput(2).SubtaskId, 1002)
        Assert.AreEqual(vInput(2).NextTasks(0).ProjectId, 3)
        Assert.AreEqual(vInput(2).NextTasks(0).SubtaskId, 1002)
        Assert.AreEqual(vInput(2).NextTasks.Count, 1, "Failed with 2")

        Assert.AreEqual(vInput(3).ProjectId, 3)
        Assert.AreEqual(vInput(3).SubtaskId, 1002)
        Assert.AreEqual(vInput(3).NextTasks(0).ProjectId, -1)
        Assert.AreEqual(vInput(3).NextTasks(0).SubtaskId, -1)
        Assert.AreEqual(vInput(3).NextTasks.Count, 1, "Failed with 2")

        Assert.AreEqual(vInput(4).ProjectId, 4)
        Assert.AreEqual(vInput(4).SubtaskId, 1002)
        Assert.AreEqual(vInput(4).NextTasks(0).ProjectId, -1)
        Assert.AreEqual(vInput(4).NextTasks(0).SubtaskId, -1)
        Assert.AreEqual(vInput(4).NextTasks.Count, 1)

        Assert.AreEqual(vInput(5).ProjectId, 5)
        Assert.AreEqual(vInput(5).SubtaskId, 1001)
        Assert.AreEqual(vInput(5).NextTasks(0).ProjectId, -1)
        Assert.AreEqual(vInput(5).NextTasks(0).SubtaskId, -1)
        Assert.AreEqual(vInput(5).NextTasks.Count, 1)


    End Sub
End Class
