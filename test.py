days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
downtime_minutes = [12,45,30,9,52]
for i in range(0,len(downtime_minutes)): 
    print(f"{days[i]}: {'#' * (downtime_minutes[i]//10)}")
