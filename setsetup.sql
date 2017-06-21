DROP PROCEDURE IF EXISTS InsertMission
GO

create procedure dbo.InsertMission(@mission nvarchar(max))
as begin
	insert into mission
	select *
	from OPENJSON(@mission) 
			WITH (	title nvarchar(30), description nvarchar(4000),
					completed bit, dueDate datetime2)
end
go

select * from mission for json path
